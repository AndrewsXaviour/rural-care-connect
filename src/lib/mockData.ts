export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string; // e.g. "Father", "Mother", "Spouse"
}

export interface Patient {
  uid: string;
  aadhaar: string;
  fullName: string;
  phone: string;
  gender?: string; // e.g. "Male" or "Female"
  bloodGroup: string;
  age: number;
  height: number;
  weight: number;
  address: string;
  houseNumber: string;
  emergencyContacts?: EmergencyContact[];
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospitalId: string;
  availableSlots: string[];
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  date: string;
  time: string;
  status: "booked" | "completed" | "cancelled";
}

export interface MedicalReport {
  id: string;
  patientId: string; // which patient this belongs to 
  hospitalId: string;
  testName: string;
  date: string;
  status: string;
  resultSummary: string; // The locked result details
}

export const DISEASE_SPECIALIZATION: Record<string, string> = {
  fever: "General Physician",
  cold: "General Physician",
  cough: "General Physician",
  skin: "Dermatologist",
  rash: "Dermatologist",
  heart: "Cardiologist",
  chest: "Cardiologist",
  bone: "Orthopedic",
  fracture: "Orthopedic",
  eye: "Ophthalmologist",
  teeth: "Dentist",
  pregnancy: "Gynecologist",
  child: "Pediatrician",
};

export const mockHospitals: Hospital[] = [
  // ── Srivilliputhur (5 regional hospitals) ──
  { id: "h1", name: "Srivilliputhur Government Hospital", address: "Hospital Chowk, Srivilliputhur", latitude: 9.5135, longitude: 77.6321, distance: 1.2 },
  { id: "h2", name: "Raja Hospital", address: "North Car Street, Mangapuram, Srivilliputhur", latitude: 9.5118, longitude: 77.6294, distance: 2.5 },
  { id: "h3", name: "Backiam Nursing Home", address: "Valaikulam Street, Srivilliputhur", latitude: 9.5147, longitude: 77.6342, distance: 4.1 },
  { id: "h4", name: "Nidhi Children's Hospital", address: "Srivilliputhur", latitude: 9.5100, longitude: 77.6350, distance: 5.8 },
  { id: "h5", name: "Sankara Narayanan Hospital", address: "Mangapuram, Srivilliputhur", latitude: 9.5125, longitude: 77.6288, distance: 6.2 },

  // ── District Hospitals (surrounding 5 districts) ──
  { id: "h6", name: "Madurai Government Rajaji Hospital", address: "Alwarpuram, Madurai", latitude: 9.9252, longitude: 78.1198, distance: 75 },
  { id: "h7", name: "Theni Government Medical College Hospital", address: "J P Nagar, Theni", latitude: 10.0240, longitude: 77.4820, distance: 60 },
  { id: "h8", name: "Dindigul Government Hospital", address: "Anna Nagar, Dindigul", latitude: 10.3554, longitude: 77.9534, distance: 90 },
  { id: "h9", name: "Tenkasi Government Hospital", address: "Kadayam Road, Tenkasi", latitude: 8.9590, longitude: 77.3135, distance: 50 },
  { id: "h10", name: "Virudhunagar District Headquarters Hospital", address: "Kamarajar Salai, Virudhunagar", latitude: 9.5698, longitude: 77.9600, distance: 40 },
];

export const mockDoctors: Doctor[] = [
  // Srivilliputhur doctors
  { id: "d1", name: "Dr. Priya Sharma", specialization: "General Physician", hospitalId: "h1", availableSlots: ["09:00", "10:00", "11:00", "14:00", "15:00"] },
  { id: "d2", name: "Dr. Rajesh Kumar", specialization: "Cardiologist", hospitalId: "h1", availableSlots: ["10:00", "11:00", "16:00"] },
  { id: "d3", name: "Dr. Anita Desai", specialization: "Dermatologist", hospitalId: "h2", availableSlots: ["09:00", "10:30", "14:00", "15:30"] },
  { id: "d4", name: "Dr. Suresh Patel", specialization: "Orthopedic", hospitalId: "h2", availableSlots: ["11:00", "14:00", "16:00"] },
  { id: "d5", name: "Dr. Meera Joshi", specialization: "Pediatrician", hospitalId: "h3", availableSlots: ["09:00", "10:00", "11:00"] },
  { id: "d6", name: "Dr. Vikram Singh", specialization: "General Physician", hospitalId: "h3", availableSlots: ["14:00", "15:00", "16:00"] },
  { id: "d7", name: "Dr. Kavita Reddy", specialization: "Gynecologist", hospitalId: "h4", availableSlots: ["09:00", "10:00", "14:00"] },
  { id: "d8", name: "Dr. Amit Verma", specialization: "Ophthalmologist", hospitalId: "h4", availableSlots: ["11:00", "15:00", "16:00"] },
  // District hospital doctors
  { id: "d9", name: "Dr. Karthik Raman", specialization: "General Physician", hospitalId: "h6", availableSlots: ["08:00", "09:00", "10:00", "14:00", "15:00"] },
  { id: "d10", name: "Dr. Shanthi Devi", specialization: "Cardiologist", hospitalId: "h6", availableSlots: ["09:00", "10:00", "11:00", "16:00"] },
  { id: "d11", name: "Dr. Murugesan Pandian", specialization: "General Physician", hospitalId: "h7", availableSlots: ["08:30", "09:30", "10:30", "14:30"] },
  { id: "d12", name: "Dr. Jayalakshmi", specialization: "Gynecologist", hospitalId: "h7", availableSlots: ["09:00", "10:00", "11:00", "15:00"] },
  { id: "d13", name: "Dr. Perumal Rajan", specialization: "Orthopedic", hospitalId: "h8", availableSlots: ["09:00", "10:00", "11:00", "14:00"] },
  { id: "d14", name: "Dr. Selvi Ayyappan", specialization: "Ophthalmologist", hospitalId: "h8", availableSlots: ["10:00", "11:00", "15:00", "16:00"] },
  { id: "d15", name: "Dr. Muthu Krishnan", specialization: "General Physician", hospitalId: "h9", availableSlots: ["08:00", "09:00", "10:00", "14:00"] },
  { id: "d16", name: "Dr. Parvathi Nachiar", specialization: "Pediatrician", hospitalId: "h9", availableSlots: ["09:00", "10:00", "11:00", "15:00"] },
  { id: "d17", name: "Dr. Balamurugan", specialization: "General Physician", hospitalId: "h10", availableSlots: ["08:00", "09:00", "10:00", "14:00", "15:00"] },
  { id: "d18", name: "Dr. Vasantha Kumari", specialization: "Dermatologist", hospitalId: "h10", availableSlots: ["09:00", "10:00", "11:00", "15:00"] },
];

export const mockReports: MedicalReport[] = [
  { id: "r1", patientId: "", hospitalId: "h1", testName: "Complete Blood Count (CBC)", date: "2024-03-10", status: "Available", resultSummary: "Hemoglobin: 13.5 g/dL (Normal). WBC count slightly elevated at 11,000/mcL. Suggestive of mild infection." },
  { id: "r2", patientId: "", hospitalId: "h2", testName: "Lipid Profile", date: "2024-02-15", status: "Available", resultSummary: "Total Cholesterol: 190 mg/dL. HDL: 45 mg/dL. LDL: 120 mg/dL. Triglycerides: 150 mg/dL. Borderline acceptable, maintain diet." },
  { id: "r3", patientId: "", hospitalId: "h3", testName: "Thyroid Function Test", date: "2024-01-20", status: "Available", resultSummary: "TSH: 2.5 mIU/L (Normal range). T3 and T4 levels within normal limits. No thyroid dysfunction detected." },
];