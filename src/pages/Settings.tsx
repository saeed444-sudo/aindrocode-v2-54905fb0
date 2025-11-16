import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Bot, User, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        const savedAiMode = localStorage.getItem('ai_mode_enabled') === 'true';
        const savedApiKey = localStorage.getItem('claude_api_key') || '';
        setAiEnabled(savedAiMode);
        setApiKey(savedApiKey);
      } else {
        navigate('/auth');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleAiToggle = (enabled: boolean) => {
    setAiEnabled(enabled);
    localStorage.setItem('ai_mode_enabled', enabled.toString());
    toast.success(enabled ? 'AI Mode enabled' : 'AI Mode disabled');
  };

  const handleApiKeySave = () => {
    localStorage.setItem('claude_api_key', apiKey);
    toast.success('API key saved');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/auth');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="min-h-screen aurora-bg p-4">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to IDE
          </Button>

          <h1 className="text-3xl font-bold mb-6">Settings</h1>

          <div className="space-y-6">
            {/* Account Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account
                </CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled />
                </div>
                <Button variant="destructive" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </CardContent>
            </Card>

            {/* AI Mode Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  AI Mode
                </CardTitle>
                <CardDescription>Configure AI-powered coding assistance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable AI Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Get AI-powered code suggestions and debugging
                    </p>
                  </div>
                  <Switch checked={aiEnabled} onCheckedChange={handleAiToggle} />
                </div>

                {aiEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-4 border-t border-border"
                  >
                    <div>
                      <Label>Anthropic API Key</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Get your API key from{' '}
                        <a
                          href="https://console.anthropic.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Anthropic Console
                        </a>
                      </p>
                      <Input
                        type="password"
                        placeholder="sk-ant-..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Model</Label>
                      <Input value="Claude 3.7 Sonnet" disabled />
                    </div>

                    <Button onClick={handleApiKeySave}>Save API Key</Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
