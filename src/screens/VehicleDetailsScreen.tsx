import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { StackScreenProps } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  RootStackParamList,
  VehicleDetails,
  PowertrainType,
  SellerType,
} from '../types';
import { StorageService } from '../storage/storage';
import { createNewInspection } from '../utils/inspectionUtils';
import { getTodayISO, formatDate } from '../utils/dateUtils';
import {
  decodeVin,
  inferPowertrain,
  ServerApiError,
} from '../services/serverApi';
import { DataCollectionService } from '../services/dataCollection';

type Props = StackScreenProps<RootStackParamList, 'VehicleDetails'>;

interface FormErrors {
  nickname?: string;
  vin?: string;
  year?: string;
  make?: string;
  model?: string;
  odometer?: string;
  askingPrice?: string;
  powertrainType?: string;
  inspectionDate?: string;
}

interface PowertrainOption {
  value: PowertrainType;
  label: string;
  icon: string;
}

const POWERTRAIN_OPTIONS: PowertrainOption[] = [
  { value: 'gasoline', label: 'Gasoline', icon: 'gas' },
  { value: 'diesel', label: 'Diesel', icon: 'diesel' },
  { value: 'hybrid', label: 'Hybrid', icon: 'hybrid' },
  { value: 'electric', label: 'Electric', icon: 'electric' },
];

const SELLER_OPTIONS: Array<{ value: SellerType; label: string }> = [
  { value: 'private', label: 'Private' },
  { value: 'dealer', label: 'Dealer' },
  { value: 'other', label: 'Other' },
];

function PowertrainIcon({
  type,
  selected,
}: {
  type: PowertrainType;
  selected: boolean;
}): React.JSX.Element {
  const color = selected ? '#FFFFFF' : '#94A3B8';
  const size = 20;

  if (type === 'gasoline' || type === 'diesel') {
    return (
      <View
        style={{
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 10,
            height: 14,
            borderRadius: 2,
            borderWidth: 2,
            borderColor: color,
          }}
        />
        <View
          style={{
            width: 6,
            height: 4,
            backgroundColor: color,
            marginTop: -2,
            borderRadius: 1,
          }}
        />
      </View>
    );
  }
  if (type === 'hybrid') {
    return (
      <View
        style={{
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: color,
          }}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            { alignItems: 'center', justifyContent: 'center' },
          ]}
        >
          <View
            style={{
              width: 8,
              height: 2,
              backgroundColor: color,
              transform: [{ rotate: '-45deg' }],
            }}
          />
        </View>
      </View>
    );
  }
  // electric - bolt icon
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 6,
          borderRightWidth: 3,
          borderBottomWidth: 10,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 3,
          borderRightWidth: 6,
          borderTopWidth: 10,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
          marginTop: -2,
        }}
      />
    </View>
  );
}

const EMPTY_VEHICLE: VehicleDetails = {
  nickname: '',
  year: '',
  make: '',
  model: '',
  trim: '',
  odometer: '',
  askingPrice: '',
  powertrainType: 'gasoline',
  sellerType: '',
  sellerLabel: '',
  vin: '',
  listingUrl: '',
  exteriorColor: '',
  inspectionDate: getTodayISO(),
  generalNotes: '',
};

function VehicleDetailsScreen({ navigation, route }: Props): React.JSX.Element {
  const { inspectionId } = route.params ?? {};
  const isEditing = !!inspectionId;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<VehicleDetails>(EMPTY_VEHICLE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [powertrainSelected, setPowertrainSelected] =
    useState<PowertrainType>('gasoline');
  const [vinLookupState, setVinLookupState] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [vinLookupMessage, setVinLookupMessage] = useState('');
  const lastLookedUpVin = useRef('');

  useEffect(() => {
    if (!inspectionId) {
      setLoading(false);
      return;
    }
    StorageService.getInspection(inspectionId).then(inspection => {
      if (inspection) {
        setForm({ ...inspection.vehicle });
        setPowertrainSelected(inspection.vehicle.powertrainType);
      }
      setLoading(false);
    });
  }, [inspectionId]);

  useEffect(() => {
    const vin = form.vin.trim().toUpperCase();
    if (vin.length !== 17 || vin === lastLookedUpVin.current) {
      if (vin.length !== 17) {
        setVinLookupState('idle');
        setVinLookupMessage('');
      }
      return;
    }

    const controller = new AbortController();
    const lookupDelay = setTimeout(async () => {
      setVinLookupState('loading');
      setVinLookupMessage('Looking up vehicle details...');
      try {
        const result = await decodeVin(vin, controller.signal);
        if (!result.year && !result.make && !result.model) {
          throw new ServerApiError(
            'No vehicle details were found for this VIN',
          );
        }

        const powertrain = inferPowertrain(result);
        const suggestedNickname = [result.year, result.make, result.model]
          .filter(Boolean)
          .join(' ');

        setForm(previous => ({
          ...previous,
          year: result.year || previous.year,
          make: result.make || previous.make,
          model: result.model || previous.model,
          trim: result.trim || previous.trim,
          nickname: previous.nickname || suggestedNickname,
          powertrainType: powertrain,
        }));
        setPowertrainSelected(powertrain);
        setErrors(previous => ({
          ...previous,
          vin: undefined,
          year: undefined,
          make: undefined,
          model: undefined,
          powertrainType: undefined,
        }));
        lastLookedUpVin.current = vin;
        setVinLookupState('success');
        setVinLookupMessage('Vehicle details filled automatically.');
        DataCollectionService.trackEvent('vin_lookup_completed', {
          result: 'success',
          cached: result.cached,
          powertrain,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setVinLookupState('error');
        setVinLookupMessage(
          error instanceof Error
            ? `${error.message}. You can continue manually.`
            : 'VIN lookup failed. You can continue manually.',
        );
        DataCollectionService.trackEvent('vin_lookup_completed', {
          result: 'error',
        });
      }
    }, 350);

    return () => {
      clearTimeout(lookupDelay);
      controller.abort();
    };
  }, [form.vin]);

  const setField = useCallback(
    <K extends keyof VehicleDetails>(key: K, value: VehicleDetails[K]) => {
      setForm(prev => ({ ...prev, [key]: value }));
      setErrors(prev => ({ ...prev, [key]: undefined }));
    },
    [],
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (form.vin.trim() && !/^[A-HJ-NPR-Z0-9]{17}$/.test(form.vin.trim())) {
      newErrors.vin = 'Enter a complete 17-character VIN';
    }
    if (!form.year.trim()) {
      newErrors.year = 'Year is required';
    } else if (!/^\d{4}$/.test(form.year.trim())) {
      newErrors.year = 'Enter a valid 4-digit year';
    }
    if (!form.make.trim()) {
      newErrors.make = 'Make is required';
    }
    if (!form.model.trim()) {
      newErrors.model = 'Model is required';
    }
    if (!form.odometer.trim()) {
      newErrors.odometer = 'Odometer reading is required';
    } else if (
      isNaN(Number(form.odometer.trim())) ||
      Number(form.odometer.trim()) < 0
    ) {
      newErrors.odometer = 'Enter a valid odometer reading';
    }
    if (!form.askingPrice.trim()) {
      newErrors.askingPrice = 'Asking price is required';
    } else if (
      isNaN(Number(form.askingPrice.trim())) ||
      Number(form.askingPrice.trim()) < 0
    ) {
      newErrors.askingPrice = 'Enter a valid price';
    }
    if (!form.inspectionDate.trim()) {
      newErrors.inspectionDate = 'Inspection date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const vehicleData: VehicleDetails = {
        ...form,
        powertrainType: powertrainSelected,
        nickname: form.nickname.trim(),
        year: form.year.trim(),
        make: form.make.trim(),
        model: form.model.trim(),
        odometer: form.odometer.trim(),
        askingPrice: form.askingPrice.trim(),
      };

      if (isEditing && inspectionId) {
        const existing = await StorageService.getInspection(inspectionId);
        if (existing) {
          const updated = {
            ...existing,
            vehicle: vehicleData,
            updatedAt: new Date().toISOString(),
          };
          await StorageService.saveInspection(updated);
        }
        navigation.goBack();
      } else {
        const newInspection = createNewInspection(vehicleData);
        await StorageService.saveInspection(newInspection);
        DataCollectionService.trackEvent('inspection_started', {
          powertrain: newInspection.vehicle.powertrainType,
          section_count: newInspection.sections.length,
          item_count: newInspection.sections.reduce(
            (total, section) => total + section.items.length,
            0,
          ),
          used_vin_lookup:
            lastLookedUpVin.current === vehicleData.vin.trim().toUpperCase(),
        });
        navigation.navigate('Checklist', {
          inspectionId: newInspection.id,
          sectionIndex: 0,
          totalSections: newInspection.sections.length,
        });
      }
    } finally {
      setSaving(false);
    }
  }, [
    form,
    powertrainSelected,
    isEditing,
    inspectionId,
    navigation,
    validateForm,
  ]);

  const handleDateChange = useCallback(
    (_event: DateTimePickerEvent, selectedDate?: Date) => {
      setShowDatePicker(false);
      if (selectedDate) {
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(selectedDate.getDate()).padStart(2, '0');
        const iso = `${y}-${m}-${d}`;
        setField('inspectionDate', iso);
      }
    },
    [setField],
  );

  const parsedDate = form.inspectionDate
    ? (() => {
        const parts = form.inspectionDate.split('-');
        if (parts.length === 3) {
          return new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2]),
          );
        }
        return new Date();
      })()
    : new Date();

  const today = new Date();

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.screenTitle}>
            {isEditing ? 'Edit Vehicle Details' : 'Vehicle Details'}
          </Text>
          <Text style={styles.screenSubtitle}>
            {isEditing
              ? 'Update the vehicle information below.'
              : 'Enter the details for the vehicle you are inspecting.'}
          </Text>

          {/* VIN first: entering it fills the vehicle fields automatically. */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>VIN</Text>
            <TextInput
              style={[styles.input, errors.vin ? styles.inputError : null]}
              value={form.vin}
              onChangeText={value =>
                setField(
                  'vin',
                  value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ''),
                )
              }
              placeholder="Enter the 17-character VIN to autofill"
              placeholderTextColor="#64748B"
              autoCapitalize="characters"
              returnKeyType="next"
              autoCorrect={false}
              maxLength={17}
            />
            {vinLookupState !== 'idle' ? (
              <View style={styles.vinStatusRow}>
                {vinLookupState === 'loading' ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : null}
                <Text
                  style={[
                    styles.vinStatusText,
                    vinLookupState === 'success' && styles.vinStatusSuccess,
                    vinLookupState === 'error' && styles.vinStatusError,
                  ]}
                >
                  {vinLookupMessage}
                </Text>
              </View>
            ) : (
              <Text style={styles.helperText}>
                Optional. Lookup uses the secure Proveh server and requires
                internet.
              </Text>
            )}
            {errors.vin ? (
              <Text style={styles.errorText}>{errors.vin}</Text>
            ) : null}
          </View>

          {/* Nickname */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Vehicle Nickname</Text>
            <TextInput
              style={[styles.input, errors.nickname ? styles.inputError : null]}
              value={form.nickname}
              onChangeText={v => setField('nickname', v)}
              placeholder='e.g. "2019 Camry - Blue"'
              placeholderTextColor="#64748B"
              returnKeyType="next"
              autoCorrect={false}
            />
            {errors.nickname ? (
              <Text style={styles.errorText}>{errors.nickname}</Text>
            ) : null}
          </View>

          {/* Year */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Year <Text style={styles.requiredText}>(required)</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.year ? styles.inputError : null]}
              value={form.year}
              onChangeText={v => setField('year', v)}
              placeholder="e.g. 2019"
              placeholderTextColor="#64748B"
              keyboardType="number-pad"
              maxLength={4}
              returnKeyType="next"
            />
            {errors.year ? (
              <Text style={styles.errorText}>{errors.year}</Text>
            ) : null}
          </View>

          {/* Make */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Make <Text style={styles.requiredText}>(required)</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.make ? styles.inputError : null]}
              value={form.make}
              onChangeText={v => setField('make', v)}
              placeholder="e.g. Toyota"
              placeholderTextColor="#64748B"
              returnKeyType="next"
              autoCorrect={false}
            />
            {errors.make ? (
              <Text style={styles.errorText}>{errors.make}</Text>
            ) : null}
          </View>

          {/* Model */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Model <Text style={styles.requiredText}>(required)</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.model ? styles.inputError : null]}
              value={form.model}
              onChangeText={v => setField('model', v)}
              placeholder="e.g. Camry"
              placeholderTextColor="#64748B"
              returnKeyType="next"
              autoCorrect={false}
            />
            {errors.model ? (
              <Text style={styles.errorText}>{errors.model}</Text>
            ) : null}
          </View>

          {/* Trim (optional) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Trim</Text>
            <TextInput
              style={styles.input}
              value={form.trim}
              onChangeText={v => setField('trim', v)}
              placeholder="e.g. SE (optional)"
              placeholderTextColor="#64748B"
              returnKeyType="next"
              autoCorrect={false}
            />
          </View>

          {/* Odometer */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Odometer (miles){' '}
              <Text style={styles.requiredText}>(required)</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.odometer ? styles.inputError : null]}
              value={form.odometer}
              onChangeText={v => setField('odometer', v)}
              placeholder="e.g. 45000"
              placeholderTextColor="#64748B"
              keyboardType="number-pad"
              returnKeyType="next"
            />
            {errors.odometer ? (
              <Text style={styles.errorText}>{errors.odometer}</Text>
            ) : null}
          </View>

          {/* Asking Price */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Asking Price <Text style={styles.requiredText}>(required)</Text>
            </Text>
            <View style={styles.priceRow}>
              <View style={styles.pricePrefix}>
                <Text style={styles.pricePrefixText}>$</Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  styles.priceInput,
                  errors.askingPrice ? styles.inputError : null,
                ]}
                value={form.askingPrice}
                onChangeText={v => setField('askingPrice', v)}
                placeholder="e.g. 12500"
                placeholderTextColor="#64748B"
                keyboardType="number-pad"
                returnKeyType="next"
              />
            </View>
            {errors.askingPrice ? (
              <Text style={styles.errorText}>{errors.askingPrice}</Text>
            ) : null}
          </View>

          {/* Powertrain Type */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Powertrain Type{' '}
              <Text style={styles.requiredText}>(required)</Text>
            </Text>
            <View style={styles.powertrainGrid}>
              {POWERTRAIN_OPTIONS.map(option => {
                const selected = powertrainSelected === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.powertrainTile,
                      selected
                        ? styles.powertrainTileSelected
                        : styles.powertrainTileUnselected,
                    ]}
                    onPress={() => {
                      setPowertrainSelected(option.value);
                      setField('powertrainType', option.value);
                      setErrors(prev => ({
                        ...prev,
                        powertrainType: undefined,
                      }));
                    }}
                    activeOpacity={0.75}
                  >
                    <PowertrainIcon type={option.value} selected={selected} />
                    <Text
                      style={[
                        styles.powertrainTileText,
                        selected
                          ? styles.powertrainTileTextSelected
                          : styles.powertrainTileTextUnselected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.powertrainType ? (
              <Text style={styles.errorText}>{errors.powertrainType}</Text>
            ) : null}
          </View>

          {/* Inspection Date */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Inspection Date{' '}
              <Text style={styles.requiredText}>(required)</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.dateButton,
                errors.inspectionDate ? styles.inputError : null,
              ]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Text
                style={
                  form.inspectionDate
                    ? styles.dateButtonText
                    : styles.dateButtonPlaceholder
                }
              >
                {form.inspectionDate
                  ? formatDate(form.inspectionDate)
                  : 'Select date'}
              </Text>
              <Text style={styles.dateChevron}>{'>'}</Text>
            </TouchableOpacity>
            {errors.inspectionDate ? (
              <Text style={styles.errorText}>{errors.inspectionDate}</Text>
            ) : null}
          </View>

          {showDatePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={parsedDate}
              mode="date"
              display="default"
              maximumDate={today}
              onChange={handleDateChange}
            />
          )}

          {/* Divider */}
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>Optional Details</Text>

          {/* Seller Type */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Seller Type</Text>
            <View style={styles.sellerRow}>
              {SELLER_OPTIONS.map(option => {
                const selected = form.sellerType === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.sellerButton,
                      selected
                        ? styles.sellerButtonSelected
                        : styles.sellerButtonUnselected,
                    ]}
                    onPress={() =>
                      setField('sellerType', selected ? '' : option.value)
                    }
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.sellerButtonText,
                        selected
                          ? styles.sellerButtonTextSelected
                          : styles.sellerButtonTextUnselected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Seller Label */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Seller Name / Label</Text>
            <TextInput
              style={styles.input}
              value={form.sellerLabel}
              onChangeText={v => setField('sellerLabel', v)}
              placeholder='e.g. "John Doe" or "ABC Motors"'
              placeholderTextColor="#64748B"
              returnKeyType="next"
              autoCorrect={false}
            />
          </View>

          {/* Exterior Color */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Exterior Color</Text>
            <TextInput
              style={styles.input}
              value={form.exteriorColor}
              onChangeText={v => setField('exteriorColor', v)}
              placeholder="e.g. Midnight Blue"
              placeholderTextColor="#64748B"
              returnKeyType="next"
              autoCorrect={false}
            />
          </View>

          {/* Listing URL */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Listing URL</Text>
            <TextInput
              style={styles.input}
              value={form.listingUrl}
              onChangeText={v => setField('listingUrl', v)}
              placeholder="Optional - paste listing URL"
              placeholderTextColor="#64748B"
              keyboardType="url"
              autoCapitalize="none"
              returnKeyType="next"
              autoCorrect={false}
            />
          </View>

          {/* General Notes */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>General Notes</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={form.generalNotes}
              onChangeText={v => setField('generalNotes', v)}
              placeholder="Any general notes about this vehicle or listing..."
              placeholderTextColor="#64748B"
              multiline
              textAlignVertical="top"
              returnKeyType="default"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              saving ? styles.saveButtonDisabled : null,
            ]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Save Changes' : 'Save and Continue'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* iOS date picker modal */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal
          transparent
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.iosDateOverlay}>
            <View style={styles.iosDateCard}>
              <View style={styles.iosDateHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.iosDateDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={parsedDate}
                mode="date"
                display="spinner"
                maximumDate={today}
                onChange={handleDateChange}
                textColor="#F1F5F9"
              />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1A1D21',
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 24,
    lineHeight: 18,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
  },
  requiredText: {
    color: '#64748B',
    fontWeight: '400',
  },
  input: {
    backgroundColor: '#242830',
    borderColor: '#3A4055',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#F1F5F9',
    fontSize: 15,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  vinStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 6,
  },
  vinStatusText: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
  },
  vinStatusSuccess: {
    color: '#22C55E',
  },
  vinStatusError: {
    color: '#F59E0B',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pricePrefix: {
    backgroundColor: '#2D3340',
    borderWidth: 1,
    borderColor: '#3A4055',
    borderRightWidth: 0,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricePrefixText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  priceInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  powertrainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  powertrainTile: {
    width: '47.5%',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  powertrainTileSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  powertrainTileUnselected: {
    backgroundColor: '#242830',
    borderColor: '#3A4055',
  },
  powertrainTileText: {
    fontSize: 14,
    fontWeight: '600',
  },
  powertrainTileTextSelected: {
    color: '#FFFFFF',
  },
  powertrainTileTextUnselected: {
    color: '#94A3B8',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButtonText: {
    color: '#F1F5F9',
    fontSize: 15,
  },
  dateButtonPlaceholder: {
    color: '#64748B',
    fontSize: 15,
  },
  dateChevron: {
    color: '#64748B',
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#3A4055',
    marginVertical: 20,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sellerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sellerButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sellerButtonSelected: {
    backgroundColor: '#1D3461',
    borderColor: '#3B82F6',
  },
  sellerButtonUnselected: {
    backgroundColor: '#242830',
    borderColor: '#3A4055',
  },
  sellerButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sellerButtonTextSelected: {
    color: '#3B82F6',
  },
  sellerButtonTextUnselected: {
    color: '#94A3B8',
  },
  multilineInput: {
    minHeight: 90,
    paddingTop: 12,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  bottomPadding: {
    height: 24,
  },
  iosDateOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  iosDateCard: {
    backgroundColor: '#242830',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
  },
  iosDateHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A4055',
  },
  iosDateDone: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VehicleDetailsScreen;
