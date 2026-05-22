import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { ADMOB_BANNER_ID } from '../config/admob';

const BannerAdWrapper: React.FC = () => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={ADMOB_BANNER_ID}
        size={BannerAdSize.BANNER}
        onAdFailedToLoad={() => {
          setFailed(true);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1D21',
    borderTopColor: '#3A4055',
    borderTopWidth: 1,
  },
});

export default BannerAdWrapper;
