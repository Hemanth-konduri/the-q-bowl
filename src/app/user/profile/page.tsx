"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UserProfilePage() {
  const [isEditing, setIsEditing] = useState(false);

  const user = {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main St, Apt 4B, City, State 12345",
  };

  return (
    <div className="min-h-screen bg-[#F7F3E8]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "#24332B" }}>
            My Profile
          </h1>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            className="rounded-xl px-6 py-2.5"
            style={{ background: "#496A5A" }}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-3xl p-8 shadow-lg mb-8 text-center">
          <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl" style={{ background: "#F7F3E8" }}>
            JD
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#24332B" }}>
            {user.name}
          </h2>
          <p className="text-sm" style={{ color: "#7C817A" }}>
            {user.email}
          </p>
        </div>

        {/* Profile Details */}
        <div className="bg-white rounded-3xl p-8 shadow-lg">
          <h3 className="text-xl font-bold mb-6" style={{ color: "#24332B" }}>
            Personal Information
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#7C817A" }}>
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  defaultValue={user.name}
                  className="w-full rounded-xl px-4 py-3 outline-none border"
                  style={{ borderColor: "#DDD9CC" }}
                />
              ) : (
                <p className="text-lg" style={{ color: "#24332B" }}>
                  {user.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#7C817A" }}>
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  defaultValue={user.email}
                  className="w-full rounded-xl px-4 py-3 outline-none border"
                  style={{ borderColor: "#DDD9CC" }}
                />
              ) : (
                <p className="text-lg" style={{ color: "#24332B" }}>
                  {user.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#7C817A" }}>
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  defaultValue={user.phone}
                  className="w-full rounded-xl px-4 py-3 outline-none border"
                  style={{ borderColor: "#DDD9CC" }}
                />
              ) : (
                <p className="text-lg" style={{ color: "#24332B" }}>
                  {user.phone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#7C817A" }}>
                Default Delivery Address
              </label>
              {isEditing ? (
                <textarea
                  defaultValue={user.address}
                  rows={3}
                  className="w-full rounded-xl px-4 py-3 outline-none border"
                  style={{ borderColor: "#DDD9CC" }}
                />
              ) : (
                <p className="text-lg" style={{ color: "#24332B" }}>
                  {user.address}
                </p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="mt-8 flex gap-4">
              <Button className="flex-1 py-3 rounded-xl" style={{ background: "#496A5A" }}>
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 rounded-xl"
                style={{ borderColor: "#DDD9CC", color: "#7C817A" }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-3xl p-8 shadow-lg mt-6">
          <h3 className="text-xl font-bold mb-6" style={{ color: "#24332B" }}>
            Preferences
          </h3>

          <div className="space-y-4">
            {[
              { label: "Email Notifications", enabled: true },
              { label: "SMS Notifications", enabled: false },
              { label: "Promotional Offers", enabled: true },
              { label: "Dietary Preferences", enabled: null },
            ].map((pref, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b" style={{ borderColor: "#DDD9CC" }}>
                <span className="font-medium" style={{ color: "#24332B" }}>
                  {pref.label}
                </span>
                <div className="flex items-center gap-3">
                  {pref.enabled === null ? (
                    <Button variant="outline" className="rounded-lg px-4 py-2 text-sm" style={{ borderColor: "#496A5A", color: "#496A5A" }}>
                      Configure
                    </Button>
                  ) : (
                    <div
                      className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${
                        pref.enabled ? "bg-[#496A5A]" : "bg-[#DDD9CC]"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-all ${
                          pref.enabled ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
