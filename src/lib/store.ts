import { Patient, Appointment, MedicalReport, EmergencyContact } from "./mockData";
import { supabase } from "./supabase";
import { encryptAadhaar, decryptAadhaar, hashAadhaar, type EncryptedAadhaar } from "./crypto";
import { queueWrite } from "./offlineQueue";

// ---------------------------------------------------------------------------
// Keys for localStorage fallback / cache (Offline first / Speed)
// ---------------------------------------------------------------------------
const PATIENT_KEY = "rural_health_patient";
const APPOINTMENTS_KEY = "rural_health_appointments";
const REPORTS_KEY = "rural_health_reports";

// ---------------------------------------------------------------------------
// Supabase row types (matches the DB schema)
// ---------------------------------------------------------------------------
interface SupabasePatientRow {
  id: string;
  aadhaar_encrypted: string | null;
  aadhaar_hash: string | null;
  aadhaar?: string;
  full_name: string;
  phone: string;
  gender: string;
  blood_group: string;
  age: number;
  height: number;
  weight: number;
  address: string;
  house_number: string;
  emergency_contacts: EmergencyContact[] | null;
  updated_at: string;
}

interface SupabaseAppointmentRow {
  id: string;
  patient_id: string;
  doctor_id: string;
  hospital_id: string;
  date: string;
  time: string;
  status: "booked" | "completed" | "cancelled";
}

interface SupabaseReportRow {
  id: string;
  patient_id: string;
  hospital_id: string;
  test_name: string;
  date: string;
  status: string;
  result_summary: string;
}

interface DbResult<T> {
  data: T | null;
  error: { message: string } | null;
}

// ---------------------------------------------------------------------------
// Helper: safe DB call with localStorage fallback
// ---------------------------------------------------------------------------
const tryDatabase = async <T>(
  dbCall: () => Promise<DbResult<T>>,
  fallback: () => T | null | undefined,
  queueInfo?: { table: string; operation: "insert" | "update" | "upsert"; payload: Record<string, unknown>; filters?: Record<string, unknown> }
): Promise<T | null | undefined> => {
  try {
    const { data, error } = await dbCall();
    if (error) throw error;
    return data;
  } catch {
    // Queue failed write for retry when back online
    if (queueInfo) {
      queueWrite(queueInfo.table, queueInfo.operation, queueInfo.payload, queueInfo.filters).catch(() => {});
    }
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

    await tryDatabase(
      async () => {
        // SEC3: Encrypt Aadhaar before storing in Supabase
        let aadhaarEncrypted: string | null = null;
        let aadhaarHash: string | null = null;
        if (patient.aadhaar) {
          const encrypted = await encryptAadhaar(patient.aadhaar);
          aadhaarEncrypted = JSON.stringify(encrypted);
          aadhaarHash = await hashAadhaar(patient.aadhaar);
        }

        const payload = {
          id: patient.uid,
          aadhaar_encrypted: aadhaarEncrypted,
          aadhaar_hash: aadhaarHash,
          full_name: patient.fullName,
          phone: patient.phone,
          gender: patient.gender,
          blood_group: patient.bloodGroup,
          age: patient.age,
          height: patient.height,
          weight: patient.weight,
          address: patient.address,
          house_number: patient.houseNumber,
          emergency_contacts: patient.emergencyContacts || [],
          updated_at: new Date().toISOString()
        };
        const res = await supabase.from("patients").upsert(payload);
        return res as unknown as DbResult<SupabasePatientRow>;
      },
      () => undefined,
      { table: "patients", operation: "upsert", payload: { id: patient.uid, aadhaar_encrypted: null, aadhaar_hash: null, full_name: patient.fullName, phone: patient.phone, gender: patient.gender, blood_group: patient.bloodGroup, age: patient.age, height: patient.height, weight: patient.weight, address: patient.address, house_number: patient.houseNumber, emergency_contacts: patient.emergencyContacts || [], updated_at: new Date().toISOString() } }
    );
  },

  get: async (uid: string): Promise<Patient | null> => {
    // Try Supabase first
    const data = await tryDatabase(
      async () => {
        const res = await supabase
          .from("patients")
          .select("*")
          .eq("id", uid)
          .maybeSingle();
        return res as unknown as DbResult<SupabasePatientRow>;
      },
      () => null
    );

    if (data) {
      // SEC3: Decrypt Aadhaar from Supabase
      let aadhaar = "";
      if (data.aadhaar_encrypted) {
        try {
          aadhaar = await decryptAadhaar(JSON.parse(data.aadhaar_encrypted) as EncryptedAadhaar);
        } catch {
          // Fallback for legacy unencrypted Aadhaar
          aadhaar = data.aadhaar || "";
        }
      } else if (data.aadhaar) {
        // Legacy unencrypted field
        aadhaar = data.aadhaar;
      }

      const patient: Patient = {
        uid: data.id,
        aadhaar,
        fullName: data.full_name,
        phone: data.phone,
        gender: data.gender,
        bloodGroup: data.blood_group,
        age: data.age,
        height: data.height,
        weight: data.weight,
        address: data.address,
        houseNumber: data.house_number,
        emergencyContacts: data.emergency_contacts || [],
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
    const data = await tryDatabase(
      async () => {
        const res = await supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", patientId);
        return res as unknown as DbResult<SupabaseAppointmentRow[]>;
      },
      () => null
    );

    if (data) {
      const mapped = data.map((a) => ({
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
        return res as unknown as DbResult<SupabaseAppointmentRow>;
      },
      () => undefined,
      { table: "appointments", operation: "insert", payload: { id: appt.id, patient_id: appt.patientId } }
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
        return res as unknown as DbResult<SupabaseAppointmentRow>;
      },
      () => undefined,
      { table: "appointments", operation: "update", payload: { status }, filters: { id } }
    );
  },
};

// ---------------------------------------------------------------------------
// Report Store — Supabase "medical_reports", localStorage fallback
// ---------------------------------------------------------------------------
export const reportStore = {
  getAllForUser: async (uid: string): Promise<MedicalReport[]> => {
    const data = await tryDatabase(
      async () => {
        const res = await supabase
          .from("medical_reports")
          .select("*")
          .eq("patient_id", uid);
        return res as unknown as DbResult<SupabaseReportRow[]>;
      },
      () => null
    );

    if (data) {
      const mapped = data.map((r) => ({
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
        return res as unknown as DbResult<SupabaseReportRow>;
      },
      () => undefined,
      { table: "medical_reports", operation: "insert", payload: { id: report.id, patient_id: report.patientId } }
    );
  },
};
