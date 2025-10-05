'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PreferencesSettings() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [autoClearTime, setAutoClearTime] = useState('20');

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const response = await fetch('/api/user/preferences');
            const data = await response.json();

            if (data.success) {
                setAutoClearTime(data.preferences.autoClearTime.toString());
            }
        } catch (error) {
            console.error('Error fetching preferences');
        }
    };

    const handleSavePreferences = async () => {
        setLoading(true);

        try {
            const response = await fetch('/api/user/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    autoClearTime: parseInt(autoClearTime),
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Preferences saved successfully', {
                    description: 'Changes will apply on next vault unlock'
                });
            } else {
                toast.error('Failed to save preferences');
            }
        } catch (error) {
            toast.error('Error saving preferences');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Application Preferences</CardTitle>
                <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="autoClearTime">Vault Session Timeout</Label>
                    <Select value={autoClearTime} onValueChange={setAutoClearTime}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select timeout" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5 minutes</SelectItem>
                            <SelectItem value="10">10 minutes</SelectItem>
                            <SelectItem value="20">20 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        Automatically lock vault after inactivity
                    </p>
                </div>

                <Button onClick={handleSavePreferences} disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Preferences'
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}