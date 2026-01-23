import { supabase } from "@/lib/supabase/client";
import { Contact } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ArrowLeft, Building2, Globe, Users, Linkedin, Mail, MapPin, Database, LayoutTemplate, ExternalLink,
    Twitter, Facebook, Clock, Languages, ShieldCheck
} from "lucide-react"; //  Added extra icons
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnrichButton } from "@/components/features/pipeline/enrich-button";
import { DraftDialog } from "@/components/features/pipeline/draft-dialog";

export const dynamic = 'force-dynamic';

export default async function CompanyDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;

    // 1. Fetch Company Info
    const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !company) {
        console.error("Error fetching company:", error);
        return notFound();
    }

    // 2. Fetch Contacts
    const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('company_id', id);

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="mx-auto max-w-6xl space-y-8">

                {/* Back Button */}
                <Link href="/">
                    <Button variant="ghost" className="pl-0 text-black hover:bg-transparent hover:underline font-semibold">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                </Link>

                {/* Company Header */}
                <div className="flex items-start justify-between border-b border-gray-300 pb-6">
                    <div>
                        <h1 className="text-4xl font-extrabold text-black tracking-tight">{company.name}</h1>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-black font-medium">
                            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-md border border-gray-200 shadow-sm">
                                <Building2 className="h-4 w-4 text-gray-500" /> {company.industry || "Unknown Industry"}
                            </div>
                            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-md border border-gray-200 shadow-sm">
                                <MapPin className="h-4 w-4 text-gray-500" /> {company.address || "No Address"}
                            </div>
                            {company.website_url && (
                                <a href={company.website_url} target="_blank" className="flex items-center gap-2 bg-white px-3 py-1 rounded-md border border-gray-200 shadow-sm text-blue-700 hover:border-blue-300 transition-colors font-bold">
                                    <Globe className="h-4 w-4" /> Visit Website
                                </a>
                            )}
                        </div>
                    </div>
                    <Badge className={`text-base px-4 py-1.5 font-bold shadow-sm ${company.status === 'QUALIFIED' ? 'bg-green-600' : 'bg-gray-600'}`}>
                        {company.status}
                    </Badge>
                </div>

                {/* --- KHỐI THÔNG TIN MỚI (Business / Tech / Audit) --- */}
                <div className="grid gap-6 md:grid-cols-3 items-stretch">

                    {/* CARD 1: BUSINESS PROFILE */}
                    <Card className="border shadow-sm h-full flex flex-col">
                        <CardHeader className="bg-white border-b border-gray-100 pb-4">
                            <CardTitle className="text-lg font-bold text-black flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-blue-600" /> Business Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6 flex-1">
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-600 font-semibold">Type</span>
                                <span className="font-bold text-black">{company.company_type || "Private"}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-600 font-semibold">Employees</span>
                                <span className="font-bold text-black">{company.employee_count || "Unknown"}</span>
                            </div>
                            <div className="flex justify-between pb-2">
                                <span className="text-gray-600 font-semibold">Est. Revenue</span>
                                <span className="font-bold text-black">{company.revenue_range || "Unknown"}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* CARD 2: TECH STACK */}
                    <Card className="border shadow-sm h-full flex flex-col">
                        <CardHeader className="bg-white border-b border-gray-100 pb-4">
                            <CardTitle className="text-lg font-bold text-black flex items-center gap-2">
                                <Database className="h-5 w-5 text-purple-600" /> Tech Stack
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6 flex-1">
                            {/* CMS */}
                            <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                                <span className="text-gray-600 font-semibold shrink-0">CMS / Web</span>
                                <div className="flex flex-wrap gap-1 justify-end">
                                    {company.tech_stack?.cms && company.tech_stack.cms.length > 0 ? (
                                        company.tech_stack.cms.map((tech: string) => (
                                            <Badge key={tech} className="bg-blue-600 font-bold hover:bg-blue-700">{tech}</Badge>
                                        ))
                                    ) : company.is_wordpress ? (
                                        <Badge className="bg-blue-600 font-bold hover:bg-blue-700">WordPress</Badge>
                                    ) : (
                                        <span className="font-bold text-gray-500 text-sm">Custom / Other</span>
                                    )}
                                </div>
                            </div>

                            {/* Frontend */}
                            {company.tech_stack?.frontend && company.tech_stack.frontend.length > 0 && (
                                <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                                    <span className="text-gray-600 font-semibold shrink-0">Frontend</span>
                                    <div className="flex flex-wrap gap-1 justify-end">
                                        {company.tech_stack.frontend.map((tech: string) => (
                                            <Badge key={tech} variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">{tech}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Ecommerce */}
                            {company.tech_stack?.ecommerce && company.tech_stack.ecommerce.length > 0 && (
                                <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                                    <span className="text-gray-600 font-semibold shrink-0">E-commerce</span>
                                    <div className="flex flex-wrap gap-1 justify-end">
                                        {company.tech_stack.ecommerce.map((tech: string) => (
                                            <Badge key={tech} className="bg-green-600 hover:bg-green-700">{tech}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Server */}
                            {company.tech_stack?.server && company.tech_stack.server.length > 0 && (
                                <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                                    <span className="text-gray-600 font-semibold shrink-0">Infrastructure</span>
                                    <div className="flex flex-wrap gap-1 justify-end">
                                        {company.tech_stack.server.map((tech: string) => (
                                            <Badge key={tech} variant="secondary" className="bg-gray-200 text-gray-700">{tech}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Agents (NEW) */}
                            {company.tech_stack?.agents && company.tech_stack.agents.length > 0 && (
                                <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                                    <span className="text-gray-600 font-semibold shrink-0">AI Agents</span>
                                    <div className="flex flex-wrap gap-1 justify-end">
                                        {company.tech_stack.agents.map((tech: string) => (
                                            <Badge key={tech} className="bg-pink-600 font-bold hover:bg-pink-700">{tech}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* CRM */}
                            <div className="flex justify-between items-center pb-2">
                                <span className="text-gray-600 font-semibold shrink-0">CRM System</span>
                                {company.crm_system ? (
                                    <Badge className="bg-orange-500 font-bold hover:bg-orange-600">{company.crm_system}</Badge>
                                ) : (
                                    <span className="font-bold text-gray-400 italic text-sm">Not Detected</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* CARD 3: TECHNICAL AUDIT */}
                    <Card className="border shadow-sm h-full flex flex-col">
                        <CardHeader className="bg-white border-b border-gray-100 pb-4">
                            <CardTitle className="text-lg font-bold text-black flex items-center gap-2">
                                <LayoutTemplate className="h-5 w-5 text-green-600" /> Site Audit
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6 flex-1">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <span className="text-gray-600 font-semibold">SSL Status</span>
                                <Badge
                                    variant={company.has_ssl ? "outline" : "destructive"}
                                    className={`font-bold ${company.has_ssl ? "border-green-600 text-green-700 bg-green-50" : ""}`}
                                >
                                    {company.has_ssl ? "Secure" : "Missing SSL"}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <span className="text-gray-600 font-semibold">PageSpeed</span>
                                <span className={`text-xl font-extrabold ${(company.pagespeed_score === null || company.pagespeed_score === undefined)
                                        ? 'text-gray-400'
                                        : company.pagespeed_score < 50
                                            ? 'text-red-600'
                                            : 'text-green-600'
                                    }`}>
                                    {company.pagespeed_score ?? "Error"}/100
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-gray-600 font-semibold">Google Maps</span>
                                <a
                                    href={company.google_maps_url || "#"}
                                    target="_blank"
                                    className="text-sm text-blue-700 font-bold hover:underline flex items-center gap-1"
                                >
                                    View on Maps <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* SALES STRATEGY */}
                <Card className="bg-slate-900 text-white border-none shadow-md">
                    <CardHeader className="border-b border-slate-700 pb-4">
                        <CardTitle className="text-lg font-bold text-white">Sales Strategy</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <p className="text-base text-slate-300 leading-relaxed font-medium">
                            {company.crm_system === 'HubSpot'
                                ? "🎯 Opportunity: They use HubSpot. Pitch our 'Quack' agent for better lead qualification inside their existing CRM."
                                : company.is_wordpress
                                    ? "🔌 Opportunity: They use WordPress. Pitch a custom plugin or integration to automate their content/sales flow."
                                    : !company.has_ssl
                                        ? "🚨 Critical: Pitch Security & Infrastructure upgrade immediately."
                                        : "✅ General: Focus on Operational Efficiency using Maestro."
                            }
                        </p>
                    </CardContent>
                </Card>

                {/* DECISION MAKERS LIST (UPDATED UI) */}
                <div className="space-y-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold flex items-center gap-3 text-black">
                            <Users className="h-7 w-7 text-gray-700" /> Decision Makers
                        </h2>
                        <EnrichButton companyId={company.id} companyName={company.name} />
                    </div>

                    {(!contacts || contacts.length === 0) ? (
                        <Card className="border-2 border-dashed border-gray-300 bg-slate-50 shadow-none">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-black">
                                <Users className="h-16 w-16 mb-4 text-gray-300" />
                                <p className="font-bold text-xl text-gray-500">No contacts found yet.</p>
                                <p className="text-base font-medium text-gray-400 mt-2">Click the button above to search for CEO/Founders.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 items-stretch">
                            {contacts.map((contact: Contact) => (
                                <Card key={contact.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                                    <CardContent className="p-5 flex flex-col gap-4 h-full">
                                        {/* Header: Avatar & Name */}
                                        <div className="flex items-start gap-4">
                                            <div className="h-12 w-12 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg shrink-0">
                                                {contact.full_name?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-lg text-black truncate">{contact.full_name}</h3>
                                                <p className="text-sm font-bold text-blue-700 truncate">{contact.position}</p>
                                            </div>
                                        </div>

                                        {/* NEW: Rich Attributes Badges */}
                                        <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                            {/* Seniority */}
                                            <div className={`px-2 py-1 rounded-md border flex items-center gap-1
                                        ${contact.seniority === 'C-Level' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                    contact.seniority === 'VP' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                        'bg-gray-50 text-gray-600 border-gray-200'}`}
                                            >
                                                <ShieldCheck className="h-3 w-3" /> {contact.seniority || "Unknown Level"}
                                            </div>

                                            {/* Language */}
                                            <div className="px-2 py-1 rounded-md border bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1">
                                                <Languages className="h-3 w-3" /> {contact.language || "Unknown"}
                                            </div>

                                            {/* Tenure */}
                                            <div className="px-2 py-1 rounded-md border bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {contact.years_in_company || "Unknown"}
                                            </div>
                                        </div>

                                        <div className="flex-1"></div>

                                        {/* Action Area */}
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
                                            <div className="flex gap-2">
                                                {/* Social Icons */}
                                                {contact.linkedin_url && (
                                                    <a href={contact.linkedin_url} target="_blank" className="p-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                                                        <Linkedin className="h-4 w-4" />
                                                    </a>
                                                )}
                                                {contact.twitter_url && (
                                                    <a href={contact.twitter_url} target="_blank" className="p-2 rounded-full bg-sky-50 text-sky-500 hover:bg-sky-100 transition-colors">
                                                        <Twitter className="h-4 w-4" />
                                                    </a>
                                                )}
                                                {contact.facebook_url && (
                                                    <a href={contact.facebook_url} target="_blank" className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                                                        <Facebook className="h-4 w-4" />
                                                    </a>
                                                )}
                                                {contact.email && (
                                                    <a href={`mailto:${contact.email}`} className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                                                        <Mail className="h-4 w-4" />
                                                    </a>
                                                )}
                                            </div>
                                            <div className="ml-auto">
                                                <DraftDialog contact={contact} company={company} industry={company.industry} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}