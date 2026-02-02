import { LucideIcon, Monitor, Moon, Sun } from 'lucide-react';
import { HTMLAttributes } from 'react';

import { Card } from '@/components/ui/card';
import { Appearance, useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export default function AppearanceToggleTab({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const tabs: { value: Appearance; icon: LucideIcon; label: string; description: string }[] = [
        { value: 'light', icon: Sun, label: 'Light', description: 'Always use light mode' },
        { value: 'dark', icon: Moon, label: 'Dark', description: 'Always use dark mode' },
        { value: 'system', icon: Monitor, label: 'System', description: 'Follow system preferences' },
    ];

    return (
        <div className={cn('grid gap-4', className)} {...props}>
            {tabs.map(({ value, icon: Icon, label, description }) => (
                <Card
                    key={value}
                    onClick={() => updateAppearance(value)}
                    className={cn(
                        'relative cursor-pointer p-4 transition-all duration-200 border-2',
                        appearance === value
                            ? 'border-primary bg-primary/5 dark:bg-primary/10'
                            : 'border-muted hover:border-primary/50 hover:bg-muted/50',
                    )}
                >
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-lg',
                            appearance === value
                                ? 'bg-primary/20 text-primary dark:bg-primary/30'
                                : 'bg-muted text-muted-foreground',
                        )}>
                            <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-foreground">{label}</p>
                            <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                        {appearance === value && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                    </div>
                </Card>
            ))}
        </div>
    );
}
