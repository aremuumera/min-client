
"use client";

import React, { useState } from 'react';
import { Scale, ShieldCheck, FileText, Fingerprint, Globe, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/tabs';
import { Divider } from '@/components/ui/divider';

const PrivacyPolicy = () => (
  <div className="space-y-12">
    <div>
      <h3 className="text-2xl font-black text-gray-900 mb-2">Privacy Policy</h3>
      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Last updated: {new Date().toLocaleDateString()}</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      <div className="space-y-4">
        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
          <Fingerprint size={20} />
        </div>
        <h4 className="text-lg font-black text-gray-900">1. Information We Collect</h4>
        <p className="text-gray-500 font-medium leading-relaxed">
          We collect information you provide directly to us, including personal information such as your name, email address, and any other information you choose to provide.
        </p>
      </div>

      <div className="space-y-4">
        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
          <Shield size={20} />
        </div>
        <h4 className="text-lg font-black text-gray-900">2. How We Use Your Information</h4>
        <p className="text-gray-500 font-medium leading-relaxed">
          We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to comply with legal obligations.
        </p>
      </div>
    </div>

    <Divider />

    <div className="space-y-4">
      <h4 className="text-lg font-black text-gray-900">3. Data Security</h4>
      <p className="text-gray-500 font-medium leading-relaxed max-w-3xl">
        We implement appropriate technical and organizational measures to protect your personal information. Our security framework is designed based on industry standards to ensure maximum protection of your business data.
      </p>
    </div>
  </div>
);

const TermsAndConditions = () => (
  <div className="space-y-12">
    <div>
      <h3 className="text-2xl font-black text-gray-900 mb-2">Terms and Conditions</h3>
      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Last updated: {new Date().toLocaleDateString()}</p>
    </div>

    <div className="prose prose-gray max-w-none">
      <div className="space-y-8">
        <section className="space-y-3">
          <h4 className="text-lg font-black text-gray-900">1. Acceptance of Terms</h4>
          <p className="text-gray-500 font-medium leading-relaxed">
            By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </section>

        <section className="space-y-3">
          <h4 className="text-lg font-black text-gray-900">2. Use License</h4>
          <p className="text-gray-500 font-medium leading-relaxed">
            Permission is granted to temporarily access the materials on our platform for personal, non-commercial transitory viewing only.
          </p>
        </section>

        <section className="space-y-3">
          <h4 className="text-lg font-black text-gray-900">3. User Responsibilities</h4>
          <p className="text-gray-500 font-medium leading-relaxed">
            Users are responsible for maintaining the confidentiality of their account information and for all activities that occur under their account.
          </p>
        </section>
      </div>
    </div>
  </div>
);

const InspectionPolicies = () => {
  const [subTab, setSubTab] = useState('local');

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:row md:items-end justify-between gap-6">
        <div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">Inspection Policies</h3>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Global compliance standards</p>
        </div>
        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setSubTab('local')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${subTab === 'local' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Local
          </button>
          <button
            onClick={() => setSubTab('international')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${subTab === 'international' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            International
          </button>
        </div>
      </div>

      <Card className="border-none bg-gray-50/50 rounded-[32px]">
        <CardContent className="p-8 md:p-12">
          {subTab === 'local' ? (
            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-xl font-black text-gray-900">Local Inspection Policies</h4>
                <p className="text-gray-500 font-medium leading-relaxed">
                  Our local inspection policies comply with all applicable domestic laws and regulations. We conduct regular audits to ensure compliance with local data protection requirements.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <h5 className="font-black text-gray-900 mb-2">Frequency</h5>
                  <p className="text-sm text-gray-500 font-medium">Conducted quarterly or as required by regulatory authorities.</p>
                </div>
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <h5 className="font-black text-gray-900 mb-2">Documentation</h5>
                  <p className="text-sm text-gray-500 font-medium">Maintained in accordance with local retention requirements.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-xl font-black text-gray-900">International Inspection Policies</h4>
                <p className="text-gray-500 font-medium leading-relaxed">
                  Our international inspection policies ensure compliance with GDPR, CCPA, and other global data protection regulations.
                </p>
              </div>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-green-600 rounded-full" />
                  </div>
                  <p className="text-gray-600 font-medium">Implement appropriate safeguards for international data transfers.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-green-600 rounded-full" />
                  </div>
                  <p className="text-gray-600 font-medium">Continuous monitoring and adaptation to global security trends.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export function LegalsMain() {
  const [activeTab, setActiveTab] = useState('privacy');

  return (
    <Card className="overflow-hidden border-none shadow-xl shadow-gray-200/50 rounded-[40px]">
      <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Scale size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Legal & Compliance</h2>
            <p className="text-sm font-medium text-gray-500">Legal documents and data protection policies</p>
          </div>
        </div>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabList variant="contained" className="bg-gray-200/50 p-1.5 rounded-2xl inline-flex w-auto">
            <Tab value="privacy" className={`rounded-xl px-6 py-3 font-bold transition-all ${activeTab === 'privacy' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Privacy Policy</Tab>
            <Tab value="terms" className={`rounded-xl px-6 py-3 font-bold transition-all ${activeTab === 'terms' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Terms & Conditions</Tab>
            <Tab value="inspection" className={`rounded-xl px-6 py-3 font-bold transition-all ${activeTab === 'inspection' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Inspection Policies</Tab>
          </TabList>
        </Tabs>
      </CardHeader>

      <CardContent className="p-8 md:p-12">
        {activeTab === 'privacy' && <PrivacyPolicy />}
        {activeTab === 'terms' && <TermsAndConditions />}
        {activeTab === 'inspection' && <InspectionPolicies />}
      </CardContent>
    </Card>
  );
}
