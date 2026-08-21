"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wallet, CreditCard, ArrowDownLeft, ArrowUpRight, Plus, Sparkles, AlertCircle } from "lucide-react";

export default function WalletPage() {
  const [balance, setBalance] = useState(1250);
  const [transactions, setTransactions] = useState([
    { id: "1", type: "CREDIT", title: "Subscription Refund Credit", amount: 450, date: "2026-08-18", status: "Completed" },
    { id: "2", type: "DEBIT", title: "Order #Q1-8842 Payment", amount: 299, date: "2026-08-15", status: "Completed" },
    { id: "3", type: "CREDIT", title: "Welcome Bonus Cash", amount: 500, date: "2026-08-10", status: "Completed" },
  ]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500 max-w-5xl mx-auto">
      
      {/* Page Header */}
      <div className="p-6 bg-[#FFF8EE] border-2 border-[#0F3329]/15 rounded-[12px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-0.5 rounded-full bg-[#0F3329] text-[#E5A00D] font-outfit text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Q1 PAY BALANCE</span>
          </span>
          <h1 className="font-outfit font-black text-3xl text-[#0F3329] uppercase tracking-tight">
            My Wallet &amp; Credits
          </h1>
          <p className="font-sans text-xs text-[#0F3329]/70 font-medium mt-1">
            Manage your meal subscription credits, instant cashback, and transaction history.
          </p>
        </div>

        <button className="px-5 py-2.5 rounded-[10px] bg-[#0F3329] text-[#f5e3cd] font-outfit text-xs font-bold uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Add Money</span>
        </button>
      </div>

      {/* Balance Card */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="p-6 bg-black text-[#f5e3cd] border-2 border-black rounded-[12px] space-y-2">
          <div className="flex items-center justify-between text-xs font-outfit font-bold uppercase text-[#E5A00D]">
            <span>Available Balance</span>
            <Wallet className="w-5 h-5" />
          </div>
          <p className="font-outfit font-black text-4xl text-white">₹{balance}</p>
          <span className="font-sans text-[11px] text-[#f5e3cd]/70 block">Auto-applied at checkout for meals &amp; plans</span>
        </div>

        <div className="p-6 bg-[#FFF8EE] border-2 border-[#0F3329]/15 rounded-[12px] space-y-2">
          <div className="flex items-center justify-between text-xs font-outfit font-bold uppercase text-[#0F3329]/70">
            <span>Subscription Credits</span>
            <CreditCard className="w-5 h-5 text-[#0F3329]" />
          </div>
          <p className="font-outfit font-black text-4xl text-[#0F3329]">2 Meals</p>
          <span className="font-sans text-[11px] text-[#0F3329]/70 block">Unused meal rollover entitlements</span>
        </div>

        <div className="p-6 bg-[#FFF8EE] border-2 border-[#0F3329]/15 rounded-[12px] space-y-2">
          <div className="flex items-center justify-between text-xs font-outfit font-bold uppercase text-[#0F3329]/70">
            <span>Cashback Earned</span>
            <Sparkles className="w-5 h-5 text-[#E5A00D]" />
          </div>
          <p className="font-outfit font-black text-4xl text-[#0F3329]">₹150</p>
          <span className="font-sans text-[11px] text-[#0F3329]/70 block">5% back on every subscription renewal</span>
        </div>
      </div>

      {/* Transaction History */}
      <div className="p-6 bg-[#FFF8EE] border-2 border-[#0F3329]/15 rounded-[12px] space-y-4">
        <h2 className="font-outfit font-black text-xl text-[#0F3329] uppercase">
          Recent Wallet Transactions
        </h2>

        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="p-4 rounded-[10px] bg-[#f5e3cd]/60 border border-[#0F3329]/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-[8px] ${tx.type === "CREDIT" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                  {tx.type === "CREDIT" ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="font-outfit font-bold text-sm text-[#0F3329]">{tx.title}</h4>
                  <span className="font-sans text-xs text-[#0F3329]/60">{tx.date} • {tx.status}</span>
                </div>
              </div>

              <span className={`font-outfit font-black text-base ${tx.type === "CREDIT" ? "text-emerald-700" : "text-red-700"}`}>
                {tx.type === "CREDIT" ? `+₹${tx.amount}` : `-₹${tx.amount}`}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
