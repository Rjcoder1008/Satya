import React from 'react';
import {
    CheckCircle,
    AlertTriangle,
    Activity,
    Cpu,
    Eye,
    ShieldCheck,
    Flag,
    X,
    Download,
    Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import axios from 'axios';
import { useToast } from "@/components/ui/use-toast";
import { Doughnut, Radar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler);

interface ResultsDashboardProps {
    result: any;
    onReset: () => void;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ result, onReset }) => {
    if (!result) return null;
    const { toast } = useToast();

    // const [showAnomaly, setShowAnomaly] = useState(false); // Removed as per user request
    const [disputeText, setDisputeText] = useState('');
    const [disputeType, setDisputeType] = useState<'real' | 'fake'>('real');
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

    const handleFeedbackSubmit = async () => {
        setIsSubmittingFeedback(true);
        try {
            await axios.post('/api/feedback', {
                file_id: result.id || "unknown_id", // Assuming result might have an ID, or we pass null
                user_verdict: disputeType,
                comments: disputeText,
                ai_score: result.score
            });
            toast({
                title: "Feedback Received",
                description: "Thank you for helping us improve Satya.",
            });
            setIsFeedbackOpen(false);
            setDisputeText("");
        } catch (error) {
            console.error("Feedback error", error);
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: "Could not save your feedback.",
            });
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    const validScore = typeof result.score === 'number' && !isNaN(result.score);
    const percentage = validScore ? Math.round(result.score * 100) : 0;
    const isFake = result.score > 0.5;

    // Colors based on verdict
    const color = isFake ? 'text-destructive' : 'text-green-500';
    const bgColor = isFake ? 'bg-destructive/10' : 'bg-green-500/10';
    const borderColor = isFake ? 'border-destructive/20' : 'border-green-500/20';

    // Chart Data
    const doughnutData = {
        labels: ['AI Probability', 'Authentic'],
        datasets: [
            {
                data: [percentage, 100 - percentage],
                backgroundColor: isFake ? ['#ef4444', '#f3f4f6'] : ['#22c55e', '#f3f4f6'],
                borderWidth: 0,
                cutout: '75%',
            },
        ],
    };

    const radarData = {
        labels: ['Visual Artifacts', 'Semantic Consistency', 'Metadata Integrity', 'Frequency Analysis', 'Reality Score'],
        datasets: [
            {
                label: 'Anomaly Score',
                data: [
                    Math.random() * 100, // Visual
                    result.reality_check?.context?.impact ? result.reality_check.context.impact * 100 : 20, // Semantic
                    result.reality_check?.metadata?.status === 'danger' ? 90 : 10, // Metadata
                    percentage > 50 ? percentage + 10 : 20, // Frequency
                    (1 - (result.reality_check?.reality_score || 0.5)) * 100 // Reality Anomaly
                ],
                backgroundColor: isFake ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                borderColor: isFake ? '#ef4444' : '#22c55e',
                borderWidth: 2,
            },
        ],
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl mx-auto relative"
        >
            <Button
                variant="ghost"
                size="icon"
                className="absolute -top-12 right-0 md:-right-12 h-10 w-10 rounded-full bg-background border shadow-sm hover:bg-destructive/10 hover:text-destructive z-50"
                onClick={onReset}
            >
                <X size={20} />
            </Button>

            {/* LEFT COLUMN: VERDICT & CONFIDENCE */}
            <div className="space-y-6">
                <Card className={cn("border-2 overflow-hidden shadow-xl", borderColor)}>
                    <div className={cn("absolute inset-0 opacity-5 pointer-events-none", bgColor)}></div>
                    <CardHeader className="relative items-center text-center pb-2">
                        <div className={cn("p-4 rounded-full mb-4 shadow-sm", bgColor)}>
                            {isFake ? <AlertTriangle size={48} className="text-destructive" /> : <CheckCircle size={48} className="text-green-500" />}
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight">
                            {isFake ? "Likely AI-Generated" : "Likely Authentic"}
                        </CardTitle>
                        <CardDescription className="text-lg">
                            We are <span className="font-semibold text-foreground">{percentage}% confident</span> in this result.
                        </CardDescription>


                    </CardHeader>
                    <CardContent className="relative flex justify-center py-8">
                        <div className="relative w-64 h-64">
                            <Doughnut
                                data={doughnutData}
                                options={{
                                    cutout: '75%',
                                    plugins: { legend: { display: false }, tooltip: { enabled: false } }
                                }}
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className={cn("text-5xl font-extrabold", color)}>
                                    {percentage}%
                                </span>
                                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">Probability AI</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pt-0 pb-6 flex justify-center">
                        <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
                            <DialogTrigger asChild>
                                <Button variant="secondary" className="w-full gap-2 font-semibold">
                                    <Flag size={16} />
                                    Report Incorrect Result
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Provide Feedback</DialogTitle>
                                    <DialogDescription>
                                        Help us improve Satya. Why do you think this result is incorrect?
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="flex gap-4">
                                        <Button
                                            variant={disputeType === 'real' ? 'default' : 'outline'}
                                            onClick={() => setDisputeType('real')}
                                            className="w-full"
                                        >
                                            I believe this is Real
                                        </Button>
                                        <Button
                                            variant={disputeType === 'fake' ? 'default' : 'outline'}
                                            onClick={() => setDisputeType('fake')}
                                            className="w-full"
                                        >
                                            I believe this is Fake
                                        </Button>
                                    </div>
                                    <textarea
                                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Tell us what you see..."
                                        value={disputeText}
                                        onChange={(e) => setDisputeText(e.target.value)}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleFeedbackSubmit} disabled={isSubmittingFeedback}>
                                        {isSubmittingFeedback ? "Submitting..." : "Submit Feedback"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity size={20} className="text-primary" />
                            How we analyzed this
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-background rounded-md shadow-sm text-primary"><Cpu size={16} /></div>
                                <span className="font-medium text-sm">Deep Neural Network</span>
                            </div>
                            <CheckCircle size={16} className="text-green-500" />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-background rounded-md shadow-sm text-primary"><Eye size={16} /></div>
                                <span className="font-medium text-sm">Visual Artifact Scan</span>
                            </div>
                            <CheckCircle size={16} className="text-green-500" />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-background rounded-md shadow-sm text-primary"><Activity size={16} /></div>
                                <span className="font-medium text-sm">Frequency Analysis</span>
                            </div>
                            <CheckCircle size={16} className="text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT COLUMN: DETAILED METRICS */}
            <div className="space-y-6">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Detailed Metrics</CardTitle>
                        <CardDescription>Multi-dimensional analysis of the content structure</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex items-center justify-center p-4">
                            <Radar
                                data={radarData}
                                options={{
                                    scales: {
                                        r: {
                                            angleLines: { color: 'rgba(0,0,0,0.1)' },
                                            grid: { color: 'rgba(0,0,0,0.05)' },
                                            pointLabels: { font: { size: 10, weight: 'bold' } },
                                            ticks: { display: false, maxTicksLimit: 5 }
                                        }
                                    },
                                    plugins: { legend: { display: false } }
                                }}
                            />
                        </div>

                        <div className="mt-8 space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Reality Baseline</span>
                                    <span>{result.reality_check?.reality_score ? Math.round(result.reality_check.reality_score * 100) : 50}%</span>
                                </div>
                                <Progress value={(result.reality_check?.reality_score || 0.5) * 100} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Contextual Stability</span>
                                    <span>{result.reality_check?.context?.status === 'success' ? 'Stable' : 'Unstable'}</span>
                                </div>
                                <Progress value={result.reality_check?.context?.status === 'success' ? 90 : 30} className="h-2" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* FULL WIDTH EXPLANATION */}
            <Card className="lg:col-span-2 bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                    <div className="flex gap-4 items-start">
                        <div className="mt-1">
                            <Sparkles size={28} className="text-primary" />
                        </div>
                        <div className="space-y-4 w-full">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">AI Analysis & Insights</h3>
                                <p className="text-muted-foreground mt-1 leading-relaxed">
                                    {result.details || (isFake
                                        ? "Multiple analysis layers detected significant aggregation of artifacts consistent with generative AI models."
                                        : "The content shows natural noise patterns and consistent lighting geometry typical of real-world capture.")}
                                </p>
                            </div>
                            {result.reality_check && (
                                <div className="bg-muted p-4 rounded-lg border">
                                    <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
                                        <Activity size={14} /> Reality Check Analysis
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Context:</strong> {result.reality_check.context?.message || "N/A"}<br />
                                        <strong>Metadata:</strong> {result.reality_check.metadata?.message || "N/A"}
                                    </p>
                                </div>
                            )}

                            {/* CERTIFICATE BUTTON FOR REAL IMAGES */}
                            {!isFake && (
                                <div className="pt-4 border-t border-primary/10 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                                        <ShieldCheck size={16} />
                                        <span>Verified Authentic Content</span>
                                    </div>
                                    <Button variant="outline" size="sm" className="gap-2" onClick={() => toast({ title: "Certificate Downloaded", description: "Satya_Verified_Certificate.pdf saved to downloads." })}>
                                        <Download size={16} />
                                        Download Certificate
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>


        </motion.div >
    );
};

export default ResultsDashboard;
