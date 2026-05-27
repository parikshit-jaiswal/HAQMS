"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, FileText, UserCircle, Stethoscope } from "lucide-react";

export default function PatientHistoryRecordsPage() {
  const { id } = useParams();
  const { token, API_BASE_URL } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    if (!token) {
      setError("Please sign in to view patient history.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchPatient = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/patients/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error("Failed to load patient history.");
        }

        const data = await res.json();
        setPatient(data);
        setError("");
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load patient history.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();

    return () => controller.abort();
  }, [API_BASE_URL, id, token]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-500/10 text-teal-600 rounded-xl">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800">Clinical History</h1>
              <p className="text-xs text-slate-400 font-semibold">
                Detailed patient history and appointment records.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-teal-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="glass p-10 rounded-2xl text-center text-slate-400 text-sm">
            Loading patient history...
          </div>
        ) : !patient ? (
          <div className="glass p-10 rounded-2xl text-center text-slate-400 text-sm">
            No patient data found.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="glass p-6 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <UserCircle className="h-6 w-6 text-teal-600" />
                <h2 className="text-lg font-extrabold text-slate-800">Patient Profile</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 text-sm text-slate-700">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Name</p>
                  <p className="font-semibold">{patient.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Gender</p>
                  <p className="font-semibold">{patient.gender}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Age</p>
                  <p className="font-semibold">{patient.age}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Phone</p>
                  <p className="font-semibold">{patient.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
                  <p className="font-semibold">{patient.email || "Not provided"}</p>
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <Stethoscope className="h-6 w-6 text-teal-600" />
                <h2 className="text-lg font-extrabold text-slate-800">Medical History</h2>
              </div>
              <p className="text-sm text-slate-700">
                {patient.medicalHistory || "No history recorded."}
              </p>
            </div>

            <div className="glass p-6 rounded-2xl border border-slate-200">
              <h2 className="text-lg font-extrabold text-slate-800 mb-4">Appointments</h2>
              {patient.appointments && patient.appointments.length > 0 ? (
                <div className="space-y-3">
                  {patient.appointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center p-3 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">Date</p>
                        <p className="text-sm font-semibold text-slate-700">
                          {new Date(appt.appointmentDate).toLocaleString()}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">Status</p>
                        <p className="text-sm font-semibold text-slate-700">{appt.status}</p>
                      </div>
                      <div className="min-w-0 sm:text-right">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">Reason</p>
                        <p className="text-sm font-semibold text-slate-700">
                          {appt.reason || "No reason provided"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No appointments found.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
