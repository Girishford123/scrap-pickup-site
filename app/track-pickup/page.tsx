"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Image from "next/image";
import { getUserSession } from "@/lib/auth";

interface PickupRequest {
  _id: string;
  status: "pending" | "scheduled" | "confirmed" | "completed" | "cancelled";
  vehicleType: string;
  address: string;
  scheduledDate?: string;
  scheduledTime?: string;
  createdAt: string;
  vehiclePhotos: string[];
  cancelReason?: string;
}

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: "⏳",
    step: 1,
  },
  scheduled: {
    label: "Scheduled",
    color: "bg-blue-100 text-blue-800",
    icon: "📅",
    step: 2,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-green-100 text-green-800",
    icon: "✅",
    step: 3,
  },
  completed: {
    label: "Completed",
    color: "bg-purple-100 text-purple-800",
    icon: "🎉",
    step: 4,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: "❌",
    step: 0,
  },
};

const steps = ["Pending", "Scheduled", "Confirmed", "Completed"];

export default function TrackPickupPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch requests function wrapped in useCallback
  const fetchRequests = useCallback(async (uid: string) => {
    try {
      const res = await fetch(`/api/request/status?userId=${uid}`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auth check and initial fetch
  useEffect(() => {
    const user = getUserSession();
    if (!user) {
      router.push("/login/requestor");
      return;
    }
    setUserId(user.id);
    fetchRequests(user.id);
  }, [router, fetchRequests]);

  const handleCancel = async (requestId: string) => {
    if (!cancelReason.trim()) {
      toast.error("Please enter a reason for cancellation");
      return;
    }

    const user = getUserSession();
    if (!user) {
      toast.error("Session expired, please login again");
      router.push("/login/requestor");
      return;
    }

    setCancelling(true);
    try {
      const res = await fetch("/api/request/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          cancelReason,
          userId: user.id,
        }),
      });

      if (res.ok) {
        toast.success("Pickup cancelled successfully");
        setCancelModal(null);
        setCancelReason("");
        fetchRequests(user.id);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to cancel pickup");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Track Your Pickups
          </h1>
          <p className="text-gray-500 mt-1">
            Monitor the status of all your scrap pickup requests
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center shadow">
            <p className="text-5xl mb-4">📦</p>
            <p className="text-gray-500 text-lg mb-4">
              No pickup requests found
            </p>
            <button
              onClick={() => router.push("/request-pickup")}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Request a Pickup
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request, i) => {
              const config = statusConfig[request.status];
              return (
                <motion.div
                  key={request._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-xl shadow p-6"
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        {request.vehicleType}
                      </h2>
                      <p className="text-sm text-gray-500">{request.address}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Submitted:{" "}
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
                    >
                      {config.icon} {config.label}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {request.status !== "cancelled" && (
                    <div className="mb-4">
                      <div className="flex justify-between mb-2">
                        {steps.map((step, idx) => (
                          <span
                            key={step}
                            className={`text-xs font-medium ${
                              idx + 1 <= config.step
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                          >
                            {step}
                          </span>
                        ))}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          className="bg-green-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(config.step / steps.length) * 100}%`,
                          }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Cancelled Reason */}
                  {request.status === "cancelled" && request.cancelReason && (
                    <div className="bg-red-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-red-600">
                        <strong>Reason:</strong> {request.cancelReason}
                      </p>
                    </div>
                  )}

                  {/* Scheduled Info */}
                  {request.scheduledDate && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-blue-700">
                        📅 Scheduled:{" "}
                        {new Date(request.scheduledDate).toLocaleDateString()}
                        {request.scheduledTime &&
                          ` at ${request.scheduledTime}`}
                      </p>
                    </div>
                  )}

                  {/* Vehicle Photos */}
                  {request.vehiclePhotos?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        Vehicle Photos:
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {request.vehiclePhotos.map((photo, idx) => (
                          <div
                            key={idx}
                            className="relative h-20 w-20 rounded-lg border border-gray-200 overflow-hidden"
                          >
                            <Image
                              src={photo}
                              alt={`Vehicle photo ${idx + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cancel Button */}
                  {!["completed", "cancelled"].includes(request.status) && (
                    <button
                      onClick={() => setCancelModal(request._id)}
                      className="text-sm text-red-500 hover:text-red-700 font-medium border border-red-300 px-4 py-2 rounded-lg hover:bg-red-50 transition"
                    >
                      Cancel Pickup
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Cancel Pickup
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Please tell us why you are cancelling
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm h-28 resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setCancelModal(null);
                  setCancelReason("");
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Go Back
              </button>
              <button
                onClick={() => handleCancel(cancelModal)}
                disabled={cancelling}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
