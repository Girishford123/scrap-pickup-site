import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPickupRequest extends Document {
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  vehicleType: string;
  vehicleCondition: string;
  vehiclePhotos: string[];
  status: "pending" | "scheduled" | "confirmed" | "completed" | "cancelled";
  scheduledDate?: Date;
  scheduledTime?: string;
  cancelledAt?: Date;
  cancelReason?: string;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PickupRequestSchema = new Schema<IPickupRequest>(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    vehicleType: { type: String, required: true },
    vehicleCondition: { type: String, required: true },
    vehiclePhotos: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["pending", "scheduled", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    scheduledDate: { type: Date },
    scheduledTime: { type: String },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
    completedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

const PickupRequest: Model<IPickupRequest> =
  mongoose.models.PickupRequest ||
  mongoose.model<IPickupRequest>("PickupRequest", PickupRequestSchema);

export default PickupRequest;