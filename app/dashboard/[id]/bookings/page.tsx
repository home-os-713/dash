"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Home as HomeIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getProperty, bookingsByProperty, fmtCurrency, type Booking } from "@/lib/v0/mockData";

export default function BookingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const property = getProperty(id);
  if (!property) notFound();

  const bookings = bookingsByProperty[id] ?? [];
  const completed = bookings.filter((b) => b.status === "completed");
  const upcoming = bookings.filter((b) => b.status !== "completed");

  const totals = {
    gross: bookings.reduce((s, b) => s + b.gross, 0),
    fees: bookings.reduce((s, b) => s + b.platformFee + b.cleaningFee + b.taxes, 0),
    net: bookings.reduce((s, b) => s + b.net, 0),
    nights: bookings.reduce((s, b) => s + b.nights, 0),
  };

  const chartData = bookings
    .slice()
    .reverse()
    .map((b) => ({ label: `${b.platform.slice(0, 1)} ${b.checkIn}`, Net: b.net, Gross: b.gross }));

  return (
    <div className="min-h-screen bg-[#2B2B2B] text-white">
      <header className="sticky top-0 z-50 bg-[#4B5436]/95 backdrop-blur-xl border-b border-[#4B5436]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link href={`/dashboard/${id}`} className="flex items-center gap-2 text-white/50 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{property.name}</span>
          </Link>
          <div className="h-5 w-px bg-[#C7BBA3]/15" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#4B5436] flex items-center justify-center">
              <HomeIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-base sm:text-lg font-bold tracking-tight">Bookings</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
          Simulated demo data
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold flex items-center gap-3">
            <Calendar className="w-7 h-7 text-[#C7BBA3]" />
            Stays &amp; net per booking
          </h1>
          <p className="text-white/50 text-sm mt-1">
            {property.name} · {property.location}
          </p>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-[#353530] border-[#4B5436]/15 text-white">
            <CardContent className="p-4">
              <p className="text-white/40 text-xs mb-1">Gross</p>
              <p className="text-xl font-bold">{fmtCurrency(totals.gross)}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#353530] border-[#4B5436]/15 text-white">
            <CardContent className="p-4">
              <p className="text-white/40 text-xs mb-1">Fees + taxes</p>
              <p className="text-xl font-bold text-red-400">−{fmtCurrency(totals.fees)}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#353530] border-[#4B5436]/15 text-white">
            <CardContent className="p-4">
              <p className="text-white/40 text-xs mb-1">Net to you</p>
              <p className="text-xl font-bold text-emerald-400">{fmtCurrency(totals.net)}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#353530] border-[#4B5436]/15 text-white">
            <CardContent className="p-4">
              <p className="text-white/40 text-xs mb-1">Nights booked</p>
              <p className="text-xl font-bold">{totals.nights}</p>
            </CardContent>
          </Card>
        </div>

        {/* Net per booking chart */}
        <Card className="bg-[#353530] border-[#4B5436]/15 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Net per booking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5436" strokeOpacity={0.2} />
                  <XAxis dataKey="label" stroke="#888780" fontSize={10} />
                  <YAxis stroke="#888780" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: "#2B2B2B", border: "1px solid #4B5436", borderRadius: 12, fontSize: 12 }}
                  />
                  <Bar dataKey="Gross" fill="#4B5436" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Net" fill="#C7BBA3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <Card className="bg-[#353530] border-[#4B5436]/15 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Upcoming &amp; current</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcoming.map((b) => (
                <BookingRow key={b.id} b={b} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Completed */}
        <Card className="bg-[#353530] border-[#4B5436]/15 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Recent stays</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {completed.map((b) => (
              <BookingRow key={b.id} b={b} />
            ))}
          </CardContent>
        </Card>

        <p className="text-white/30 text-xs italic pt-4">All bookings are simulated for design review.</p>
      </main>
    </div>
  );
}

function BookingRow({ b }: { b: Booking }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-[#4B5436]/10 bg-white/[0.02]">
      <Badge className="bg-white/[0.04] text-white/60 border-0 text-[10px] px-1.5 py-0 h-5 shrink-0">
        {b.platform}
      </Badge>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{b.guest}</p>
        <p className="text-[11px] text-white/40">
          {b.checkIn} → {b.checkOut} · {b.nights} nights
        </p>
      </div>
      <div className="hidden sm:flex flex-col items-end shrink-0 mr-4">
        <p className="text-[11px] text-white/40">
          gross {fmtCurrency(b.gross)} · fees −{fmtCurrency(b.platformFee + b.cleaningFee + b.taxes)}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-emerald-400">+{fmtCurrency(b.net)}</p>
        <p className="text-[10px] text-white/30">net to you</p>
      </div>
    </div>
  );
}
