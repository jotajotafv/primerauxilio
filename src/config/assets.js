export const ASSETS = Object.freeze({
  instructor: 'FirstAid_Instructor.glb',
  patient: 'Patient_Adult_FirstAid.glb',
  trainingRoom: 'FirstAid_Modular_TrainingRoom.glb',
  cprMannequin: 'First_Aid_3D_CPR_Mannequin.glb',
  heimlich: 'First_Aid_3D_Heimlich.glb',
  anatomyTorso: 'EDU_AnatomyTorso.glb',
  bleedingArm: 'EDU_BleedingArm.glb',
  bleedingLeg: 'FirstAid_Educational_Leg.glb',
  burnHand: 'FirstAid_Burn_HandForearm.glb',
  fracturedArm: 'First_Aid_3D_Arm_Closed_Fracture.glb',
  fracturedLeg: 'FirstAid_Leg_ClosedFracture.glb',
  firstAidKit: 'FirstAidKit_Interactive.glb',
  bandage: 'FirstAid_Bandage.glb',
  gauze: 'FirstAid_Gauze.glb',
  medicalTape: 'MedicalTape.glb',
  medicalGloves: 'FirstAid_MedicalGloves.glb',
  cprMask: 'FirstAid_CPR_Mask.glb',
  splint: 'FirstAid_UniversalSplint.glb',
  coldPack: 'ColdPack.glb',
  stretcher: 'Medical_Stretcher.glb',
});

const BASE_URL = import.meta.env ? import.meta.env.BASE_URL : '/';

export function assetUrl(id) {
  if (!ASSETS[id]) throw new Error(`Asset desconocido: ${id}`);
  return `${BASE_URL}models/${ASSETS[id]}`;
}
