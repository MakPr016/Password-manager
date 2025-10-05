'use client';

import { SetStateAction, useState } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

export default function GeneratePage() {
    const [password, setPassword] = useState('');
    const [length, setLength] = useState(16);
    const [includeUppercase, setIncludeUppercase] = useState(true);
    const [includeLowercase, setIncludeLowercase] = useState(true);
    const [includeNumbers, setIncludeNumbers] = useState(true);
    const [includeSymbols, setIncludeSymbols] = useState(true);

    const generatePassword = () => {
        let charset = '';
        if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (includeNumbers) charset += '0123456789';
        if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

        if (charset === '') {
            toast.error('Please select at least one character type');
            return;
        }

        let generatedPassword = '';
        for (let i = 0; i < length; i++) {
            generatedPassword += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        setPassword(generatedPassword);
    };

    const copyToClipboard = () => {
        if (!password) return;
        navigator.clipboard.writeText(password);
        toast.success('Password copied to clipboard!');
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8">Password Generator</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Generate Strong Password</CardTitle>
                    <CardDescription>
                        Create a secure password with custom settings
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Generated Password</Label>
                        <div className="flex gap-2">
                            <Input
                                value={password}
                                readOnly
                                placeholder="Click generate to create password"
                                className="font-mono"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={copyToClipboard}
                                disabled={!password}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Password Length: {length}</Label>
                        <Slider
                            value={[length]}
                            onValueChange={(value: SetStateAction<number>[]) => setLength(value[0])}
                            min={8}
                            max={32}
                            step={1}
                        />
                    </div>

                    <div className="space-y-3">
                        <Label>Character Types</Label>
                        
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="uppercase"
                                checked={includeUppercase}
                                onCheckedChange={(checked) => setIncludeUppercase(checked as boolean)}
                            />
                            <label htmlFor="uppercase" className="text-sm cursor-pointer">
                                Uppercase Letters (A-Z)
                            </label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="lowercase"
                                checked={includeLowercase}
                                onCheckedChange={(checked) => setIncludeLowercase(checked as boolean)}
                            />
                            <label htmlFor="lowercase" className="text-sm cursor-pointer">
                                Lowercase Letters (a-z)
                            </label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="numbers"
                                checked={includeNumbers}
                                onCheckedChange={(checked) => setIncludeNumbers(checked as boolean)}
                            />
                            <label htmlFor="numbers" className="text-sm cursor-pointer">
                                Numbers (0-9)
                            </label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="symbols"
                                checked={includeSymbols}
                                onCheckedChange={(checked) => setIncludeSymbols(checked as boolean)}
                            />
                            <label htmlFor="symbols" className="text-sm cursor-pointer">
                                Symbols (!@#$%^&*)
                            </label>
                        </div>
                    </div>

                    <Button onClick={generatePassword} className="w-full">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Generate Password
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
