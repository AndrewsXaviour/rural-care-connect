import { Patient, Appointment, MedicalReport } from "./mockData";
import { supabase } from "./supabase";

// ---------------------------------------------------------------------------
// Keys for localStorage fallback / cache (Offline first / Speed)
// ---------------------------------------------------------------------------
const PATIENT_KEY = "rural_health_patient";
const APPOINTMENTS_KEY = "rural_health_appointments";
const REPORTS_KEY = "rural_health_reports";

// ---------------------------------------------------------------------------
// Helper: safe DB call with localStorage fallback
// ---------------------------------------------------------------------------
const tryDatabase = async <T>(
  dbCall: () => Promise<{ data: T | null; error: any }>,
  fallback: () => T | any
): Promise<T | any> => {
  try {
    const { data, error } = await dbCall();
    if (error) throw error;
    return data;
  } catch (error) {
    console.warn("⚠️ Database call failed, using localStorage:", error.message || error);
    return fallback();
  }
};

// ---------------------------------------------------------------------------
// Patient Store — Supabase "patients", localStorage fallback
// ---------------------------------------------------------------------------
export const patientStore = {
  save: async (patient: Patient): Promise<void> => {
    // Always persist to localStorage for instant reads / offline
    localStorage.setItem(PATIENT_KEY, JSON.stringify(patient));
    console.log("💾 Persisted patient to local storage:", patient.fullName);
    
    await tryDatabase(
      async () => {
        const res = await supabase.from("patients").upsert({
          id: patient.uid,
          aadhaar: patient.aadhaar,
          full_name: patient.fullName,
          phone: patient.phone,
          gender: patient.gender,
          blood_group: patient.bloodGroup,
          age: patient.age,
          height: patient.height,
          weight: patient.weight,
          address: patient.address,
          house_number: patient.houseNumber,
          updated_at: new Date().toISOString()
        });
        if (!res.error) console.log("☁️ Synced patient profile to Supabase.");
        return res;
      },
      () => undefined
    );
  },

  get: async (uid: string): Promise<Patient | null> => {
    console.log("🔍 Fetching patient data for:", uid);
    // Try Supabase first
    const data = await tryDatabase(
      async () => {
        const res = await supabase
          .from("patients")
          .select("*")
          .eq("id", uid)
          .maybeSingle();
        if (res.data) console.log("✅ Fetched profile from Supabase.");
        else console.log("ℹ️ No existing profile found in Supabase — new user.");
        return res;
      },
      () => null
    );

    if (data) {
      const patient: Patient = {
        uid: data.id,
        aadhaar: data.aadhaar,
        fullName: data.full_name,
        phone: data.phone,
        gender: data.gender,
        bloodGroup: data.blood_group,
        age: data.age,
        height: data.height,
        weight: data.weight,
        address: data.address,
        houseNumber: data.house_number
      };
      localStorage.setItem(PATIENT_KEY, JSON.stringify(patient));
      return patient;
    }

    // Fallback to localStorage
    const cached = localStorage.getItem(PATIENT_KEY);
    return cached ? (JSON.parse(cached) as Patient) : null;
  },

  getCached: (): Patient | null => {
    const data = localStorage.getItem(PATIENT_KEY);
    return data ? (JSON.parse(data) as Patient) : null;
  },
};

// ---------------------------------------------------------------------------
// Appointment Store — Supabase "appointments", localStorage fallback
// ---------------------------------------------------------------------------
export const appointmentStore = {
  getAll: async (patientId: string): Promise<Appointment[]> => {
    console.log("📅 Fetching appointments for:", patientId);
    const data = await tryDatabase(
      async () => {
        const res = await supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", patientId);
        if (res.data) console.log(`✅ Fetched ${res.data.length} appointments from Supabase.`);
        return res;
      },
      () => null
    );

    if (data) {
      const mapped = data.map((a: any) => ({
        id: a.id,
        patientId: a.patient_id,
        doctorId: a.doctor_id,
        hospitalId: a.hospital_id,
        date: a.date,
        time: a.time,
        status: a.status
      }));
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(mapped));
      return mapped;
    }

    // Fallback
    const cached = localStorage.getItem(APPOINTMENTS_KEY);
    const all: Appointment[] = cached ? JSON.parse(cached) : [];
    return all.filter((a) => a.patientId === patientId);
  },

  add: async (appt: Appointment): Promise<void> => {
    // localStorage
    const cached = localStorage.getItem(APPOINTMENTS_KEY);
    const all: Appointment[] = cached ? JSON.parse(cached) : [];
    all.push(appt);
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(all));
    console.log("💾 Cached new appointment locally.");

    // Supabase
    await tryDatabase(
      async () => {
        const res = await supabase.from("appointments").insert({
          id: appt.id,
          patient_id: appt.patientId,
          doctor_id: appt.doctorId,
          hospital_id: appt.hospitalId,
          date: appt.date,
          time: appt.time,
          status: appt.status
        });
        if (!res.error) console.log("☁️ Synced appointment to Supabase.");
        return res;
      },
      () => undefined
    );
  },

  updateStatus: async (id: string, status: Appointment["status"]): Promise<void> => {
    // localStorage
    const cached = localStorage.getItem(APPOINTMENTS_KEY);
    const all: Appointment[] = cached ? JSON.parse(cached) : [];
    const appt = all.find((a) => a.id === id);
    if (appt) {
      appt.status = status;
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(all));
    }

    // Supabase
    await tryDatabase(
      async () => {
        const res = await supabase
          .from("appointments")
          .update({ status })
          .eq("id", id);
        if (!res.error) console.log("☁️ Updated appointment status in Supabase.");
        return res;
      },
      () => undefined
    );
  },
};

// ---------------------------------------------------------------------------
// Report Store — Supabase "medical_reports", localStorage fallback
// ---------------------------------------------------------------------------
export const reportStore = {
  getAllForUser: async (uid: string): Promise<MedicalReport[]> => {
    console.log("📄 Fetching medical reports for:", uid);
    const data = await tryDatabase(
      async () => {
        const res = await supabase
          .from("medical_reports")
          .select("*")
          .eq("patient_id", uid);
        if (res.data) console.log(`✅ Fetched ${res.data.length} reports from Supabase.`);
        return res;
      },
      () => null
    );

    if (data) {
      const mapped = data.map((r: any) => ({
        id: r.id,
        patientId: r.patient_id,
        hospitalId: r.hospital_id,
        testName: r.test_name,
        date: r.date,
        status: r.status,
        resultSummary: r.result_summary
      }));
      localStorage.setItem(REPORTS_KEY, JSON.stringify(mapped));
      return mapped;
    }

    // Fallback
    const cached = localStorage.getItem(REPORTS_KEY);
    const allReports: MedicalReport[] = cached ? JSON.parse(cached) : [];
    return allReports.filter((r) => r.patientId === uid);
  },

  add: async (report: MedicalReport): Promise<void> => {
    // localStorage
    const cached = localStorage.getItem(REPORTS_KEY);
    const all: MedicalReport[] = cached ? JSON.parse(cached) : [];
    all.push(report);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(all));
    console.log("💾 Cached new report locally.");

    // Supabase
    await tryDatabase(
      async () => {
        const res = await supabase.from("medical_reports").insert({
          id: report.id,
          patient_id: report.patientId,
          hospital_id: report.hospitalId,
          test_name: report.testName,
          date: report.date,
          status: report.status,
          result_summary: report.resultSummary
        });
        if (!res.error) console.log("☁️ Synced report to Supabase.");
        return res;
      },
      () => undefined
    );
  },
};
