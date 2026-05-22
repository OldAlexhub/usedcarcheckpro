#!/usr/bin/env python3
"""
Used Car Check Pro - Release Build Script
Developer: Old Alex Hub
Package:   com.oldalexhub.usedcarcheckpro
"""

import argparse
import glob
import json
import os
import platform
import secrets
import shutil
import string
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# ANSI color helpers
# ---------------------------------------------------------------------------

def _supports_color() -> bool:
    """Return True when the terminal supports ANSI escape codes."""
    if os.name == "nt":
        # Windows Terminal, VS Code terminal, and modern cmd all support ANSI.
        # Older cmd.exe does not; check the WT_SESSION env var as a heuristic.
        return (
            os.environ.get("WT_SESSION") is not None
            or os.environ.get("TERM_PROGRAM") is not None
            or os.environ.get("COLORTERM") is not None
        )
    return hasattr(sys.stdout, "isatty") and sys.stdout.isatty()


USE_COLOR = _supports_color()


def _c(code: str, text: str) -> str:
    if USE_COLOR:
        return f"\033[{code}m{text}\033[0m"
    return text


def green(t):   return _c("32", t)
def yellow(t):  return _c("33", t)
def red(t):     return _c("31", t)
def cyan(t):    return _c("36", t)
def bold(t):    return _c("1",  t)
def magenta(t): return _c("35", t)


def step(n: int, msg: str):
    print(f"\n{bold(cyan(f'[STEP {n}]'))} {msg}")


def ok(msg: str):
    print(f"  {green('PASS')}  {msg}")


def warn(msg: str):
    print(f"  {yellow('WARN')}  {msg}")


def fail(msg: str):
    print(f"  {red('FAIL')}  {msg}")


def info(msg: str):
    print(f"  {cyan('INFO')}  {msg}")


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

APP_NAME          = "Used Car Check Pro"
PACKAGE_NAME      = "com.oldalexhub.usedcarcheckpro"
VERSION_NAME      = "1.0.0"
VERSION_CODE      = 1
DEVELOPER         = "Old Alex Hub"
ADMOB_APP_ID      = "ca-app-pub-7831002909037560~9160533701"
PROD_BANNER       = "ca-app-pub-7831002909037560/1263382299"
PROD_INTERSTITIAL = "ca-app-pub-7831002909037560/2251967276"
TEST_BANNER       = "ca-app-pub-3940256099942544/6300978111"
TEST_INTERSTITIAL = "ca-app-pub-3940256099942544/1033173712"
KEYSTORE_FILENAME = "usedcarcheckpro-release.keystore"
KEY_ALIAS         = "usedcarcheckpro"

IS_WINDOWS = os.name == "nt"

# ---------------------------------------------------------------------------
# Path helpers
# ---------------------------------------------------------------------------

def script_dir() -> Path:
    """Absolute directory that contains this script."""
    return Path(__file__).resolve().parent


def android_dir() -> Path:
    return script_dir() / "android"


def keystore_path() -> Path:
    return android_dir() / "app" / KEYSTORE_FILENAME


def keystore_props_path() -> Path:
    return android_dir() / "keystore.properties"


def admob_ts_path() -> Path:
    return script_dir() / "src" / "config" / "admob.ts"


def manifest_path() -> Path:
    return android_dir() / "app" / "src" / "main" / "AndroidManifest.xml"


def build_gradle_path() -> Path:
    return android_dir() / "app" / "build.gradle"


def local_properties_path() -> Path:
    return android_dir() / "local.properties"


def gradlew() -> str:
    return "gradlew.bat" if IS_WINDOWS else "./gradlew"


def releases_dir() -> Path:
    """One level up from the project folder, sibling directory 'releases'."""
    return script_dir().parent / "releases"


def release_folder() -> Path:
    date_str = datetime.now().strftime("%Y%m%d")
    return releases_dir() / f"UsedCarCheckPro-v{VERSION_NAME}-{date_str}"


# ---------------------------------------------------------------------------
# Java Detection
# ---------------------------------------------------------------------------

def _candidate_java_dirs_windows() -> list:
    """Return an ordered list of candidate Java home directories on Windows."""
    candidates = []

    # 1) JAVA_HOME env var
    if os.environ.get("JAVA_HOME"):
        candidates.append(Path(os.environ["JAVA_HOME"]))

    # 2) Android Studio JBR/JDK
    local_app = Path(os.environ.get("LOCALAPPDATA", r"C:\Users\Public\AppData\Local"))
    candidates += [
        Path(r"C:\Program Files\Android\Android Studio\jbr"),
        Path(r"C:\Program Files\Android\Android Studio\jre"),
        local_app / "Programs" / "Android Studio" / "jbr",
        local_app / "Programs" / "Android Studio" / "jre",
    ]

    # 3) Common JDK locations
    for pattern in [
        r"C:\Program Files\Java\*",
        r"C:\Program Files\Microsoft\jdk-*",
        r"C:\Program Files\Eclipse Adoptium\*",
    ]:
        matches = sorted(glob.glob(pattern), reverse=True)  # latest first
        candidates += [Path(m) for m in matches]

    return candidates


def _java_version_from_output(output: str):
    """Parse the integer major version from `java -version` stderr/stdout."""
    for line in output.splitlines():
        if "version" in line:
            # Patterns: '17.0.8', '1.8.0_382', '"17"', '"1.8"'
            import re
            m = re.search(r'"(\d+)(?:\.(\d+))?', line)
            if m:
                major = int(m.group(1))
                if major == 1:
                    # Old-style: 1.8 means Java 8
                    minor = int(m.group(2) or 0)
                    return minor
                return major
    return None


def _validate_java_home(java_home: Path) -> tuple:
    """
    Validate a candidate java_home.
    Returns (True, version_int, java_exe_path) or (False, None, None).
    """
    java_exe = java_home / "bin" / ("java.exe" if IS_WINDOWS else "java")
    if not java_exe.exists():
        return False, None, None
    try:
        result = subprocess.run(
            [str(java_exe), "-version"],
            capture_output=True,
            text=True,
            timeout=15,
        )
        combined = result.stdout + result.stderr
        version = _java_version_from_output(combined)
        if version is not None and version >= 17:
            return True, version, java_exe
        return False, version, java_exe
    except Exception:
        return False, None, None


def detect_java() -> tuple:
    """
    Find a suitable Java installation (>= 17).
    Returns (java_home_path: Path, java_exe: Path, version: int) or raises SystemExit.
    """
    if IS_WINDOWS:
        candidates = _candidate_java_dirs_windows()
    else:
        # Unix: check JAVA_HOME, then common locations
        candidates = []
        if os.environ.get("JAVA_HOME"):
            candidates.append(Path(os.environ["JAVA_HOME"]))
        for pattern in [
            "/usr/lib/jvm/java-*",
            "/usr/lib/jvm/temurin-*",
            "/opt/homebrew/opt/openjdk*",
        ]:
            candidates += [Path(m) for m in sorted(glob.glob(pattern), reverse=True)]

    for candidate in candidates:
        if candidate.exists():
            valid, version, java_exe = _validate_java_home(candidate)
            if valid:
                return candidate, java_exe, version

    # Fallback: 'java' in PATH
    java_in_path = shutil.which("java")
    if java_in_path:
        try:
            result = subprocess.run(
                ["java", "-version"],
                capture_output=True,
                text=True,
                timeout=15,
            )
            combined = result.stdout + result.stderr
            version = _java_version_from_output(combined)
            if version is not None and version >= 17:
                return None, Path(java_in_path), version
        except Exception:
            pass

    print(red("\nERROR: Java 17 or newer not found."))
    print("  Install Java 17+ and set JAVA_HOME, or install Android Studio which bundles a JDK.")
    print("  Download: https://adoptium.net/")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Android SDK Detection
# ---------------------------------------------------------------------------

def detect_android_sdk() -> Path:
    """
    Locate the Android SDK directory.
    Returns the SDK Path or raises SystemExit.
    """
    adb_name = "platform-tools/adb.exe" if IS_WINDOWS else "platform-tools/adb"

    # 1) Env vars
    for var in ("ANDROID_HOME", "ANDROID_SDK_ROOT"):
        val = os.environ.get(var)
        if val:
            sdk = Path(val)
            if (sdk / adb_name).exists():
                return sdk

    # 2) Windows-specific common locations
    if IS_WINDOWS:
        username = os.environ.get("USERNAME", "")
        local_app = Path(os.environ.get("LOCALAPPDATA", rf"C:\Users\{username}\AppData\Local"))
        candidates = [
            local_app / "Android" / "Sdk",
            Path(rf"C:\Users\{username}\AppData\Local\Android\Sdk"),
            Path(r"C:\Android\Sdk"),
        ]
    else:
        home = Path.home()
        candidates = [
            home / "Android" / "Sdk",
            home / "Library" / "Android" / "sdk",
            Path("/opt/android-sdk"),
        ]

    for sdk in candidates:
        if sdk.exists() and (sdk / adb_name).exists():
            return sdk

    print(red("\nERROR: Android SDK not found."))
    print("  Install Android Studio and set ANDROID_HOME to the SDK location.")
    print("  Typical path: %LOCALAPPDATA%\\Android\\Sdk  (Windows)")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Node modules
# ---------------------------------------------------------------------------

def ensure_node_modules() -> None:
    """Run npm install if node_modules is absent or package.json is newer."""
    project_root = script_dir()
    nm = project_root / "node_modules"
    pkg = project_root / "package.json"

    needs_install = not nm.exists()
    if not needs_install and pkg.exists():
        # Re-install if package.json is newer than node_modules
        needs_install = pkg.stat().st_mtime > nm.stat().st_mtime

    if needs_install:
        info("node_modules not found or out of date — running npm install...")
        npm_cmd = "npm.cmd" if IS_WINDOWS else "npm"
        result = subprocess.run(
            [npm_cmd, "install"],
            cwd=str(project_root),
            capture_output=False,
        )
        if result.returncode != 0:
            fail("npm install failed. Fix the errors above, then re-run release.py.")
            sys.exit(1)
        ok("npm install complete.")
    else:
        ok("node_modules present — skipping npm install.")


# ---------------------------------------------------------------------------
# Environment auto-configure
# ---------------------------------------------------------------------------

def configure_environment(java_home: Path, sdk_path: Path) -> dict:
    """
    Return a copy of the current environment with JAVA_HOME, ANDROID_HOME,
    and ANDROID_SDK_ROOT set; also write android/local.properties.
    """
    env = os.environ.copy()

    if java_home is not None:
        env["JAVA_HOME"] = str(java_home)

    sdk_str = str(sdk_path)
    env["ANDROID_HOME"] = sdk_str
    env["ANDROID_SDK_ROOT"] = sdk_str

    # Write local.properties with forward slashes (Gradle requirement)
    sdk_forward = sdk_str.replace("\\", "/")
    props_file = local_properties_path()
    props_file.write_text(f"sdk.dir={sdk_forward}\n", encoding="utf-8")
    info(f"Wrote {props_file}")

    return env


# ---------------------------------------------------------------------------
# Signing / Keystore
# ---------------------------------------------------------------------------

def read_keystore_properties() -> dict:
    """Parse android/keystore.properties into a dict."""
    props = {}
    kp = keystore_props_path()
    if not kp.exists():
        return props
    for line in kp.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and "=" in line and not line.startswith("#"):
            key, _, value = line.partition("=")
            props[key.strip()] = value.strip()
    return props


def write_keystore_properties(store_file: str, store_pass: str,
                               key_alias: str, key_pass: str):
    """Write android/keystore.properties. Passwords are never echoed after this."""
    content = (
        f"storeFile={store_file}\n"
        f"storePassword={store_pass}\n"
        f"keyAlias={key_alias}\n"
        f"keyPassword={key_pass}\n"
    )
    keystore_props_path().write_text(content, encoding="utf-8")
    info(f"Wrote {keystore_props_path()}")


def _random_password(length: int = 28) -> str:
    """Generate a random alphanumeric password using the secrets module."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _find_keytool(java_home: Path = None) -> str:
    """
    Locate the keytool executable.
    Search order: java_home/bin, JAVA_HOME env var, PATH.
    """
    kt_name = "keytool.exe" if IS_WINDOWS else "keytool"

    # 1) Next to the java_home passed by the caller (most reliable)
    if java_home is not None:
        candidate = java_home / "bin" / kt_name
        if candidate.exists():
            return str(candidate)

    # 2) JAVA_HOME environment variable
    env_java_home = os.environ.get("JAVA_HOME", "")
    if env_java_home:
        candidate = Path(env_java_home) / "bin" / kt_name
        if candidate.exists():
            return str(candidate)

    # 3) PATH
    found = shutil.which("keytool")
    if found:
        return found

    print(red("  ERROR: keytool not found. Install a JDK and ensure JAVA_HOME is set."))
    sys.exit(1)


def generate_keystore(java_home: Path = None):
    """Auto-generate a release keystore with a random secure password. No prompts."""
    print(bold("\nGenerating release keystore automatically..."))

    store_pass = _random_password(28)
    key_pass = _random_password(28)

    dname = "CN=Old Alex Hub, OU=Old Alex Hub, O=Old Alex Hub, L=Unknown, S=Unknown, C=US"

    keytool = _find_keytool(java_home)

    cmd = [
        keytool,
        "-genkeypair", "-v",
        "-storetype", "PKCS12",
        "-keystore", str(keystore_path()),
        "-alias", KEY_ALIAS,
        "-keyalg", "RSA",
        "-keysize", "2048",
        "-validity", "10000",
        "-dname", dname,
        "-storepass", store_pass,
        "-keypass", key_pass,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(red("  keytool failed:"))
        print(result.stderr)
        sys.exit(1)

    write_keystore_properties(KEYSTORE_FILENAME, store_pass, KEY_ALIAS, key_pass)
    print(green(f"  Keystore:    {keystore_path()}"))
    print(green(f"  Properties:  {keystore_props_path()}"))
    print()
    print(bold(yellow("  IMPORTANT - Back up these two files before publishing:")))
    print(yellow(f"    {keystore_path()}"))
    print(yellow(f"    {keystore_props_path()}"))
    print(yellow("  If you lose the keystore you cannot update the app on Google Play."))
    print(yellow("  Never commit keystore.properties to version control."))


def auto_setup_signing(java_home: Path = None, generate_only: bool = False) -> bool:
    """
    Ensure release signing is configured.
    Fully automatic - no interactive prompts.
    Returns True if release keystore is ready, False if falling back to debug signing.
    """
    ks = keystore_path()
    kp = keystore_props_path()

    if ks.exists():
        info(f"Found existing keystore: {ks}")
        if kp.exists():
            props = read_keystore_properties()
            required = {"storeFile", "storePassword", "keyAlias", "keyPassword"}
            if required.issubset(props.keys()):
                ok("Keystore and properties validated.")
                return True
            else:
                fail("keystore.properties is incomplete.")
                print(yellow("  The keystore exists but keystore.properties is missing entries."))
                print(yellow(f"  Restore it manually, or delete {ks.name} to auto-generate a new one."))
                return False
        else:
            fail("keystore.properties not found.")
            print(yellow("  The keystore exists but keystore.properties is missing."))
            print(yellow(f"  Restore it manually, or delete {ks.name} to auto-generate a new one."))
            return False

    # No keystore - create one automatically
    generate_keystore(java_home)
    return True


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------

def validate_admob() -> bool:
    """Validate AdMob configuration in src/config/admob.ts."""
    print(bold("\nValidating AdMob configuration..."))
    ts_file = admob_ts_path()
    if not ts_file.exists():
        fail(f"admob.ts not found at {ts_file}")
        return False

    content = ts_file.read_text(encoding="utf-8")
    all_pass = True

    # 1) Production IDs present
    if PROD_BANNER in content:
        ok(f"Production banner ID present:       {PROD_BANNER}")
    else:
        fail(f"Production banner ID MISSING:       {PROD_BANNER}")
        all_pass = False

    if PROD_INTERSTITIAL in content:
        ok(f"Production interstitial ID present:  {PROD_INTERSTITIAL}")
    else:
        fail(f"Production interstitial ID MISSING:  {PROD_INTERSTITIAL}")
        all_pass = False

    # 2) Test IDs present
    if TEST_BANNER in content:
        ok(f"Test banner ID present:              {TEST_BANNER}")
    else:
        warn(f"Test banner ID not found:            {TEST_BANNER}")

    if TEST_INTERSTITIAL in content:
        ok(f"Test interstitial ID present:        {TEST_INTERSTITIAL}")
    else:
        warn(f"Test interstitial ID not found:      {TEST_INTERSTITIAL}")

    # 3) DEV guard: production IDs used when __DEV__ is false
    if "__DEV__" in content or "IS_DEV" in content:
        # Check the ternary pattern: IS_DEV ? TEST : PROD or __DEV__ ? TEST : PROD
        import re
        # Pattern: (IS_DEV|__DEV__) ? TEST_xxx : PROD_xxx  (order in ternary)
        dev_guard_ok = (
            re.search(r"IS_DEV\s*\?\s*TEST_BANNER_ID\s*:\s*PROD_BANNER_ID", content) or
            re.search(r"__DEV__\s*\?\s*TEST_BANNER_ID\s*:\s*PROD_BANNER_ID", content) or
            (re.search(r"IS_DEV\s*\?", content) and PROD_BANNER in content)
        )
        if dev_guard_ok:
            ok("Production IDs gated behind __DEV__ == false (correct)")
        else:
            warn("Could not confirm __DEV__ guard on production IDs - review manually")
    else:
        warn("No __DEV__ guard detected - ensure production IDs are not used in dev builds")

    return all_pass


def validate_permissions() -> bool:
    """Validate AndroidManifest.xml permissions."""
    print(bold("\nValidating Android permissions..."))
    mf = manifest_path()
    if not mf.exists():
        fail(f"AndroidManifest.xml not found: {mf}")
        return False

    content = mf.read_text(encoding="utf-8")
    all_pass = True

    # Must have INTERNET
    if "android.permission.INTERNET" in content:
        ok("INTERNET permission present")
    else:
        fail("INTERNET permission MISSING")
        all_pass = False

    # Must NOT have CAMERA
    if "android.permission.CAMERA" not in content:
        ok("CAMERA permission absent (correct)")
    else:
        fail("CAMERA permission present - remove it if not needed")
        all_pass = False

    # Must NOT have ACCESS_FINE_LOCATION
    if "android.permission.ACCESS_FINE_LOCATION" not in content:
        ok("ACCESS_FINE_LOCATION absent (correct)")
    else:
        fail("ACCESS_FINE_LOCATION present - remove it if not needed")
        all_pass = False

    # Must NOT have READ_EXTERNAL_STORAGE
    if "android.permission.READ_EXTERNAL_STORAGE" not in content:
        ok("READ_EXTERNAL_STORAGE absent (correct)")
    else:
        fail("READ_EXTERNAL_STORAGE present - remove it if not needed")
        all_pass = False

    return all_pass


def validate_admob_manifest() -> bool:
    """Validate that the AdMob App ID meta-data is correct in AndroidManifest.xml."""
    print(bold("\nValidating AdMob manifest entry..."))
    mf = manifest_path()
    if not mf.exists():
        fail(f"AndroidManifest.xml not found: {mf}")
        return False

    content = mf.read_text(encoding="utf-8")

    if "com.google.android.gms.ads.APPLICATION_ID" in content:
        ok("AdMob APPLICATION_ID meta-data present")
    else:
        warn("AdMob APPLICATION_ID meta-data missing from AndroidManifest.xml")
        return False

    if ADMOB_APP_ID in content:
        ok(f"AdMob App ID correct: {ADMOB_APP_ID}")
        return True
    else:
        warn(f"AdMob App ID may be incorrect. Expected: {ADMOB_APP_ID}")
        return False


def validate_privacy_files() -> bool:
    """Check that required store/legal files exist."""
    print(bold("\nValidating privacy and store files..."))
    root = script_dir()
    checks = [
        (root / "PRIVACYPOLICY.md",              "PRIVACYPOLICY.md"),
        (root / "README.md",                     "README.md"),
        (root / "app-ads.txt",                   "app-ads.txt"),
        (root / "store_assets",                  "store_assets/ directory"),
        (root / "store_assets" / "data-safety-notes.md", "store_assets/data-safety-notes.md"),
    ]
    all_pass = True
    for path, label in checks:
        if path.exists():
            ok(f"{label} found")
        else:
            fail(f"{label} NOT found - create before store submission")
            all_pass = False
    return all_pass


def validate_package_name() -> bool:
    """Verify applicationId and namespace in build.gradle."""
    print(bold("\nValidating package name in build.gradle..."))
    bg = build_gradle_path()
    if not bg.exists():
        fail(f"build.gradle not found: {bg}")
        return False

    content = bg.read_text(encoding="utf-8")
    all_pass = True

    if f'applicationId "{PACKAGE_NAME}"' in content:
        ok(f"applicationId = {PACKAGE_NAME}")
    else:
        fail(f"applicationId mismatch. Expected: {PACKAGE_NAME}")
        all_pass = False

    if f'namespace "{PACKAGE_NAME}"' in content:
        ok(f"namespace = {PACKAGE_NAME}")
    else:
        fail(f"namespace mismatch. Expected: {PACKAGE_NAME}")
        all_pass = False

    return all_pass


def run_all_validations() -> dict:
    """Run every validation and return a results dict."""
    results = {}
    results["admob"]       = validate_admob()
    results["permissions"] = validate_permissions()
    results["admob_mf"]    = validate_admob_manifest()
    results["privacy"]     = validate_privacy_files()
    results["package"]     = validate_package_name()
    return results


# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------

def _run_gradle(cmd_args: list, env: dict, cwd: Path):
    """Run a Gradle command, stream output, and raise on failure."""
    gradlew_cmd = [gradlew()] + cmd_args
    if IS_WINDOWS:
        # On Windows, must be invoked via cmd /c so batch file is found
        full_cmd = ["cmd", "/c"] + gradlew_cmd
    else:
        full_cmd = gradlew_cmd

    print(f"  Running: {' '.join(gradlew_cmd)}")
    process = subprocess.Popen(
        full_cmd,
        cwd=str(cwd),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    output_lines = []
    for line in process.stdout:
        line = line.rstrip()
        output_lines.append(line)
        print(f"    {line}")

    process.wait()
    if process.returncode != 0:
        print(red(f"\n  Gradle failed with exit code {process.returncode}"))
        sys.exit(1)


def build_release(env: dict, do_clean: bool = True) -> tuple:
    """
    Build the release AAB and APK.
    Returns (aab_path: Path | None, apk_path: Path | None).
    """
    and_dir = android_dir()

    if do_clean:
        step(0, "Cleaning previous build...")
        _run_gradle(["clean"], env, and_dir)

    step(0, "Building AAB (bundleRelease)...")
    _run_gradle(["bundleRelease"], env, and_dir)

    step(0, "Building APK (assembleRelease)...")
    _run_gradle(["assembleRelease"], env, and_dir)

    aab = android_dir() / "app" / "build" / "outputs" / "bundle" / "release" / "app-release.aab"
    apk = android_dir() / "app" / "build" / "outputs" / "apk"    / "release" / "app-release.apk"

    return (aab if aab.exists() else None, apk if apk.exists() else None)


# ---------------------------------------------------------------------------
# Output packaging
# ---------------------------------------------------------------------------

def _copy_if_exists(src: Path, dst: Path):
    if src.exists():
        if src.is_dir():
            if dst.exists():
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, dst)
        return True
    return False


def package_release(apk_path, aab_path, java_home, sdk_path, signing_ok: bool) -> Path:
    """
    Copy release artifacts into releases/UsedCarCheckPro-vX.Y.Z-[date]/.
    Returns the release folder Path.
    """
    rel_folder = release_folder()
    rel_folder.mkdir(parents=True, exist_ok=True)
    info(f"Release folder: {rel_folder}")

    root = script_dir()

    # APK and AAB
    versioned_apk = rel_folder / f"UsedCarCheckPro-v{VERSION_NAME}.apk"
    versioned_aab = rel_folder / f"UsedCarCheckPro-v{VERSION_NAME}.aab"

    if apk_path and Path(apk_path).exists():
        shutil.copy2(apk_path, versioned_apk)
        ok(f"Copied APK  -> {versioned_apk.name}")
    else:
        warn("APK not found, skipping copy.")

    if aab_path and Path(aab_path).exists():
        shutil.copy2(aab_path, versioned_aab)
        ok(f"Copied AAB  -> {versioned_aab.name}")
    else:
        warn("AAB not found, skipping copy.")

    # Supporting files
    extras = [
        (root / "README.md",         rel_folder / "README.md"),
        (root / "PRIVACYPOLICY.md",  rel_folder / "PRIVACYPOLICY.md"),
        (root / "app-ads.txt",       rel_folder / "app-ads.txt"),
        (root / "assets" / "logo.png", rel_folder / "logo.png"),
        (root / "store_assets",      rel_folder / "store_assets"),
    ]
    for src, dst in extras:
        if _copy_if_exists(src, dst):
            ok(f"Copied {src.name}")
        else:
            warn(f"Optional file not found: {src.name}")

    # release_info.json
    signing_status = "signed" if signing_ok else "debug-signed"
    release_info = {
        "appName":       APP_NAME,
        "packageName":   PACKAGE_NAME,
        "version":       VERSION_NAME,
        "versionCode":   VERSION_CODE,
        "buildDate":     datetime.now().isoformat(),
        "developer":     DEVELOPER,
        "apkPath":       str(versioned_apk.relative_to(rel_folder)) if versioned_apk.exists() else "",
        "aabPath":       str(versioned_aab.relative_to(rel_folder)) if versioned_aab.exists() else "",
        "signingStatus": signing_status,
        "javaPath":      str(java_home) if java_home else "PATH",
        "sdkPath":       str(sdk_path),
    }
    info_file = rel_folder / "release_info.json"
    info_file.write_text(json.dumps(release_info, indent=2), encoding="utf-8")
    ok(f"Written release_info.json")

    return rel_folder


# ---------------------------------------------------------------------------
# Screenshot capture
# ---------------------------------------------------------------------------

def capture_screenshots(rel_folder: Path) -> Path | None:
    """
    Capture up to 3 screenshots from a connected adb device/emulator.
    Returns the screenshots directory or None if adb is unavailable.
    """
    adb = shutil.which("adb")
    if not adb:
        warn("adb not found in PATH, skipping screenshot capture.")
        return None

    # Check that a device is connected
    result = subprocess.run([adb, "devices"], capture_output=True, text=True, timeout=10)
    lines = [l.strip() for l in result.stdout.splitlines() if l.strip()]
    device_lines = [l for l in lines[1:] if "\t" in l and "offline" not in l]
    if not device_lines:
        warn("No adb device/emulator connected. Skipping screenshot capture.")
        return None

    screenshots_dir = rel_folder / "screenshots"
    screenshots_dir.mkdir(parents=True, exist_ok=True)

    # Launch app
    info(f"Launching {PACKAGE_NAME} on device...")
    subprocess.run(
        [adb, "shell", "am", "start", "-n",
         f"{PACKAGE_NAME}/.MainActivity"],
        timeout=15,
    )
    time.sleep(3)

    captured = 0
    for i in range(1, 4):
        remote = f"/sdcard/screenshot_{i}.png"
        local  = screenshots_dir / f"screenshot_{i:02d}.png"

        subprocess.run(
            [adb, "shell", "screencap", "-p", remote],
            timeout=15,
        )
        pull = subprocess.run(
            [adb, "pull", remote, str(local)],
            capture_output=True,
            timeout=15,
        )
        if pull.returncode == 0 and local.exists():
            ok(f"Screenshot {i}: {local.name}")
            captured += 1
        else:
            warn(f"Failed to pull screenshot {i}")

        if i < 3:
            info("Waiting 10 seconds before next screenshot...")
            time.sleep(10)

    print(f"\n  {green(str(captured))} screenshots captured to: {screenshots_dir}")
    print(magenta("\n  Suggested Play Store screenshot captions:"))
    captions = [
        "1. Search any vehicle by VIN or plate number",
        "2. Instant accident and damage history report",
        "3. Odometer fraud detection at a glance",
        "4. Full ownership and title check",
        "5. Market value comparison tool",
        "6. Lien and loan status verification",
        "7. Recall and safety notice alerts",
        "8. Export and share your full report",
    ]
    for caption in captions:
        print(f"     {caption}")

    return screenshots_dir


# ---------------------------------------------------------------------------
# File-size helper
# ---------------------------------------------------------------------------

def _file_mb(path) -> str:
    if path is None:
        return "N/A"
    p = Path(path)
    if not p.exists():
        return "N/A"
    return f"{p.stat().st_size / 1_048_576:.1f} MB"


# ---------------------------------------------------------------------------
# Summary report
# ---------------------------------------------------------------------------

def print_summary(
    build_ok: bool,
    aab_path,
    apk_path,
    java_home,
    java_version,
    sdk_path,
    signing_ok: bool,
    validations: dict,
    rel_folder,
    screenshots_dir,
):
    border = "=" * 60
    build_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    java_label = f"{java_home if java_home else 'PATH'}  (Java {java_version})"
    signing_label = (
        "Signed with release keystore"
        if signing_ok
        else "Debug keystore (NOT for production)"
    )
    signing_color = green if signing_ok else red

    def pf(flag):
        return green("PASS") if flag else red("FAIL")

    aab_label = str(aab_path) if aab_path else "Not built"
    apk_label = str(apk_path) if apk_path else "Not built"

    print(f"\n{bold(border)}")
    print(bold(f"  {APP_NAME.upper()} - RELEASE SUMMARY"))
    print(bold(border))
    print()
    status_text = green("SUCCESS") if build_ok else red("FAILED")
    print(f"BUILD STATUS:     {status_text}")
    print(f"VERSION:          {VERSION_NAME} (build {VERSION_CODE})")
    print(f"BUILD DATE:       {build_date}")
    print()
    print(bold("ARTIFACTS:"))
    print(f"  APK:            {apk_label}  ({_file_mb(apk_path)})")
    print(f"  AAB:            {aab_label}  ({_file_mb(aab_path)})")
    print()
    print(bold("ENVIRONMENT:"))
    print(f"  Java:           {java_label}")
    print(f"  Android SDK:    {sdk_path}")
    print()
    print(bold("SIGNING:"))
    print(f"  Status:         {signing_color(signing_label)}")
    print(f"  Keystore:       {keystore_path()}")
    print()
    print(bold("ADMOB:"))
    admob_ok = validations.get("admob", False) and validations.get("admob_mf", False)
    print(f"  Status:         {green('VALIDATED') if admob_ok else yellow('WARNING')}")
    print(f"  App ID:         {ADMOB_APP_ID}")
    print(f"  Banner ID:      {PROD_BANNER}")
    print(f"  Interstitial:   {PROD_INTERSTITIAL}")
    print()
    print(bold("VALIDATIONS:"))
    print(f"  Package name:   {pf(validations.get('package', False))}")
    print(f"  Permissions:    {pf(validations.get('permissions', False))}")
    print(f"  Privacy files:  {pf(validations.get('privacy', False))}")
    print(f"  AdMob manifest: {pf(validations.get('admob_mf', False))}")
    print()
    print(bold("STORE ASSETS:"))
    store_path = script_dir() / "store_assets"
    print(f"  {store_path}")
    print(bold("SCREENSHOTS:"))
    print(f"  {screenshots_dir if screenshots_dir else 'Not captured'}")
    print()
    print(bold("NEXT STEPS:"))
    print("  1. Upload the AAB file to Google Play Console")
    print("  2. Complete the store listing with screenshots and graphics")
    print("  3. Fill in Data Safety form (see store_assets/data-safety-notes.md)")
    print("  4. Set pricing to Free")
    print("  5. Submit for review")
    print()
    print(bold(border))


# ---------------------------------------------------------------------------
# CLI / main
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(
        prog="release.py",
        description=f"{APP_NAME} - Release Build Script",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python release.py                  Full build with all checks\n"
            "  python release.py --check-env      Validate environment only\n"
            "  python release.py --generate-key-only  Create signing keystore only\n"
            "  python release.py --skip-build     Validate but skip Gradle build\n"
            "  python release.py --screenshots-only   Capture screenshots only\n"
            "  python release.py --no-clean       Build without clean step\n"
        ),
    )
    parser.add_argument("--check-env",          action="store_true", help="Check environment only, do not build")
    parser.add_argument("--generate-key-only",  action="store_true", help="Create signing keystore only")
    parser.add_argument("--skip-build",         action="store_true", help="Skip the Gradle build step")
    parser.add_argument("--skip-screenshots",   action="store_true", help="Skip screenshot capture via adb")
    parser.add_argument("--screenshots-only",   action="store_true", help="Only capture screenshots, no build")
    parser.add_argument("--clean",              action="store_true", default=True, help="Force clean before build (default)")
    parser.add_argument("--no-clean",           action="store_true", help="Skip clean step")
    return parser.parse_args()


def main():
    args = parse_args()
    do_clean = not args.no_clean

    print(bold(f"\n{'=' * 60}"))
    print(bold(f"  {APP_NAME} - Release Build Script"))
    print(bold(f"  Package: {PACKAGE_NAME}"))
    print(bold(f"{'=' * 60}\n"))

    try:
        # ---- Handle special single-purpose modes ----

        if args.generate_key_only:
            step(1, "Detecting Java for keytool...")
            _jh, _je, _jv = detect_java()
            ok(f"Java {_jv} found: {_je}")
            step(2, "Generating release keystore...")
            if keystore_path().exists():
                warn(f"Keystore already exists: {keystore_path()}")
                info("Delete it manually if you want to regenerate.")
                return
            generate_keystore(java_home=_jh)
            ok("Keystore generation complete.")
            return

        # ---- Environment detection ----

        step(1, "Detecting Java installation...")
        java_home, java_exe, java_version = detect_java()
        ok(f"Java {java_version} found: {java_exe}")

        step(2, "Detecting Android SDK...")
        sdk_path = detect_android_sdk()
        ok(f"Android SDK found: {sdk_path}")

        if args.check_env:
            ok("Environment check complete. All required tools found.")
            return

        # ---- Configure environment ----

        step(3, "Configuring build environment...")
        ensure_node_modules()
        build_env = configure_environment(java_home, sdk_path)
        ok("Environment configured.")

        # ---- Screenshots-only mode ----

        if args.screenshots_only:
            step(4, "Capturing screenshots...")
            ss_dir = capture_screenshots(release_folder())
            if ss_dir:
                ok(f"Screenshots saved to: {ss_dir}")
            return

        # ---- Signing ----

        step(4, "Setting up signing configuration...")
        signing_ok = auto_setup_signing(java_home=java_home)

        # ---- Validations ----

        step(5, "Running pre-build validations...")
        validations = run_all_validations()

        # ---- Build ----

        aab_path = None
        apk_path = None

        if not args.skip_build:
            step(6, "Building release artifacts...")
            aab_path, apk_path = build_release(build_env, do_clean=do_clean)

            if aab_path:
                ok(f"AAB built: {aab_path}")
            else:
                warn("AAB output not found after build.")

            if apk_path:
                ok(f"APK built: {apk_path}")
            else:
                warn("APK output not found after build.")
        else:
            info("Build step skipped (--skip-build).")

        # ---- Package ----

        step(7, "Packaging release artifacts...")
        rel_folder = package_release(apk_path, aab_path, java_home, sdk_path, signing_ok)
        ok(f"Release packaged: {rel_folder}")

        # ---- Screenshots ----

        screenshots_dir = None
        if not args.skip_screenshots:
            step(8, "Capturing screenshots...")
            screenshots_dir = capture_screenshots(rel_folder)
        else:
            info("Screenshot capture skipped (--skip-screenshots).")

        # ---- Summary ----

        build_ok = (aab_path is not None or args.skip_build)
        print_summary(
            build_ok=build_ok,
            aab_path=aab_path,
            apk_path=apk_path,
            java_home=java_home,
            java_version=java_version,
            sdk_path=sdk_path,
            signing_ok=signing_ok,
            validations=validations,
            rel_folder=rel_folder,
            screenshots_dir=screenshots_dir,
        )

    except KeyboardInterrupt:
        print(yellow("\n\nBuild interrupted by user (Ctrl+C). Exiting."))
        sys.exit(0)


if __name__ == "__main__":
    main()
