import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SignaturePrefState {
  save_signature_enabled: boolean;
}

const initialState: SignaturePrefState = {
  save_signature_enabled: false,
};

const signaturePrefSlice = createSlice({
  name: "signaturePref",
  initialState,
  reducers: {
    updateLocalPref: (state, action: PayloadAction<boolean>) => {
      state.save_signature_enabled = action.payload;
    },
  },
});

export const { updateLocalPref } = signaturePrefSlice.actions;
export default signaturePrefSlice.reducer;
