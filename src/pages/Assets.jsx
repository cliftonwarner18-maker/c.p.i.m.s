import React from 'react';
import LoadingScreen from '../components/LoadingScreen';
import SerializedAssetsSection from '../components/assets/SerializedAssetsSection';
import NonSerializedAssetsSection from '../components/assets/NonSerializedAssetsSection';
import DecommissionedAssetsSection from '../components/assets/DecommissionedAssetsSection';

export default function Assets() {
  return (
    <>
      <LoadingScreen isLoading={false} />
      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        <SerializedAssetsSection />
        <NonSerializedAssetsSection />
        <DecommissionedAssetsSection />
      </div>
    </>
  );
}