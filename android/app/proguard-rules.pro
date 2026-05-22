# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Google Mobile Ads
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.ads.** { *; }

# Keep native methods
-keepclassmembers class *  {
    native <methods>;
}

# Keep Parcelable implementations
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep R classes
-keepclassmembers class **.R$* {
    public static <fields>;
}

# Third-party libraries used by this project
-keep class com.rnfs.** { *; }
-keep class com.reactnativeshare.** { *; }
