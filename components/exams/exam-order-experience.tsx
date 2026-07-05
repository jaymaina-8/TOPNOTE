"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EXAM_CLASSES, buildPriceMap } from "@/lib/exams/classes";
import type { ExamSessionWithPrices } from "@/lib/exams/types";
import {
  clearDraft,
  clearGeneratedOrder,
  loadDraft,
  loadGeneratedOrder,
  saveDraft,
  saveGeneratedOrder,
  type GeneratedExamOrder,
} from "@/lib/exams/draft-storage";
import { getExamOrderByTokenAction } from "@/lib/actions/submit-exam-order";
import { ExamPricingTable } from "./exam-pricing-table";
import { ExamOrderForm } from "./exam-order-form";

type ExamOrderExperienceProps = {
  session: ExamSessionWithPrices;
};

export function ExamOrderExperience({ session }: ExamOrderExperienceProps) {
  const priceMap = useMemo(() => buildPriceMap(session.prices), [session.prices]);
  const [schoolName, setSchoolName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [county, setCounty] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [draftRestored, setDraftRestored] = useState(false);
  const [generatedOrder, setGeneratedOrder] = useState<GeneratedExamOrder | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [didHydrate, setDidHydrate] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll back to the top of the form section after a reset
  useEffect(() => {
    if (formKey === 0) return;
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [formKey]);
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    EXAM_CLASSES.reduce(
      (acc, item) => {
        acc[item.key] = 0;
        return acc;
      },
      {} as Record<string, number>,
    ),
  );

  useEffect(() => {
    const hydrateTimeout = window.setTimeout(() => {
      const draft = loadDraft();
      if (draft) {
        setSchoolName(draft.schoolName ?? "");
        setContactPerson(draft.contactPerson ?? "");
        setPhoneNumber(draft.phoneNumber ?? "");
        setCounty(draft.county ?? "");
        setDeliveryLocation(draft.deliveryLocation ?? "");
        setAdditionalNotes(draft.additionalNotes ?? "");
        setQuantities((current) => {
          const next = { ...current };
          for (const item of EXAM_CLASSES) {
            const quantity = Number(draft.quantities?.[item.key] ?? 0);
            next[item.key] = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 0;
          }
          return next;
        });
        setDraftRestored(true);
      }

      const loadedOrder = loadGeneratedOrder();
      setGeneratedOrder(loadedOrder);
      
      const hasActiveSession = typeof window !== "undefined" && !!window.sessionStorage.getItem("activeOrderSession");
      setSessionActive(hasActiveSession);

      if (loadedOrder?.whatsappUrl) {
        setWhatsappUrl(loadedOrder.whatsappUrl);
      }
      const token = loadedOrder?.downloadToken || (loadedOrder as unknown as { download_token?: string })?.download_token;
      if (token) {
        getExamOrderByTokenAction(token).then((res) => {
          if (res?.whatsappUrl) {
            setWhatsappUrl(res.whatsappUrl);
          }
        });
      }
      setDidHydrate(true);
    }, 0);

    return () => {
      window.clearTimeout(hydrateTimeout);
    };
  }, []);

  useEffect(() => {
    if (!didHydrate) return;
    const timeout = window.setTimeout(() => {
      saveDraft({
        schoolName,
        contactPerson,
        phoneNumber,
        county,
        deliveryLocation,
        additionalNotes,
        quantities,
      });
    }, 500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    didHydrate,
    schoolName,
    contactPerson,
    phoneNumber,
    county,
    deliveryLocation,
    additionalNotes,
    quantities,
  ]);

  const totals = useMemo(() => {
    let totalPapers = 0;
    let totalAmount = 0;

    for (const item of EXAM_CLASSES) {
      const quantity = quantities[item.key] ?? 0;
      if (quantity <= 0) continue;
      totalPapers += quantity;
      totalAmount += Math.round((priceMap[item.key] ?? 0) * quantity);
    }

    return { totalPapers, totalAmount };
  }, [priceMap, quantities]);

  const updateQuantity = (classKey: string, value: string) => {
    const parsed = Number.parseInt(value, 10);
    setQuantities((current) => ({
      ...current,
      [classKey]: Number.isFinite(parsed) && parsed > 0 ? parsed : 0,
    }));
  };

  const handleGeneratedOrder = useCallback((order: GeneratedExamOrder, nextWhatsappUrl?: string) => {
    setGeneratedOrder(order);
    saveGeneratedOrder(order);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("activeOrderSession", "true");
    }
    setSessionActive(true);
    if (nextWhatsappUrl) {
      setWhatsappUrl(nextWhatsappUrl);
    }
  }, []);

  const handleStartNewOrder = useCallback(() => {
    // Clear persisted storage first so hydration cannot restore the old order
    clearDraft();
    clearGeneratedOrder();
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("activeOrderSession");
    }

    // Reset all parent-controlled state
    setSessionActive(false);
    setGeneratedOrder(null);
    setWhatsappUrl(null);
    setDraftRestored(false);
    setSchoolName("");
    setContactPerson("");
    setPhoneNumber("");
    setCounty("");
    setDeliveryLocation("");
    setAdditionalNotes("");
    setQuantities(
      EXAM_CLASSES.reduce(
        (acc, item) => {
          acc[item.key] = 0;
          return acc;
        },
        {} as Record<string, number>,
      ),
    );

    // Increment formKey to remount <ExamOrderForm>, resetting useActionState
    // back to initialState. This is the only way to reset useActionState
    // externally — React resets all component state when the key changes.
    setFormKey((k) => k + 1);
  }, []);

  return (
    <div ref={containerRef} className="space-y-10 md:space-y-12">
      {/* Current Exam Session Section with Pricing Table */}
      <section className="overflow-hidden rounded-3xl border border-primary/10 bg-white shadow-[var(--shadow-sm)]">
        <div className="border-b border-primary/10 bg-gradient-to-br from-primary/8 via-white to-white px-5 py-8 sm:px-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Current Exam Session</h2>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-neutral-950 md:text-3xl">{session.name}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600">
            Prices below are per exam paper. Enter quantities for each class to build your order sheet.
          </p>
        </div>

        <ExamPricingTable priceMap={priceMap} />
      </section>

      {/* Styled order form */}
      <ExamOrderForm
        key={formKey}
        session={session}
        priceMap={priceMap}
        schoolName={schoolName}
        contactPerson={contactPerson}
        phoneNumber={phoneNumber}
        county={county}
        deliveryLocation={deliveryLocation}
        additionalNotes={additionalNotes}
        onSchoolNameChange={setSchoolName}
        onContactPersonChange={setContactPerson}
        onPhoneNumberChange={setPhoneNumber}
        onCountyChange={setCounty}
        onDeliveryLocationChange={setDeliveryLocation}
        onAdditionalNotesChange={setAdditionalNotes}
        quantities={quantities}
        updateQuantity={updateQuantity}
        totals={totals}
        generatedOrder={generatedOrder}
        whatsappUrl={whatsappUrl}
        draftRestored={draftRestored}
        sessionActive={sessionActive}
        onGeneratedOrder={handleGeneratedOrder}
        onStartNewOrder={handleStartNewOrder}
      />
    </div>
  );
}