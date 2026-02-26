import { HTMLAttributes } from 'react';

import { Card } from '@/components/ui/card';
import {
    COLOR_THEMES,
    ColorTheme,
    useAppearance,
} from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

type ThemePreset = {
    value: ColorTheme;
    label: string;
    description: string;
    gradient: string;
};

const presets: ThemePreset[] = [
    {
        value: 'default',
        label: 'Default',
        description: 'Netral modern',
        gradient: 'linear-gradient(120deg, #334155 0%, #111827 100%)',
    },
    {
        value: 'ocean',
        label: 'Ocean',
        description: 'Biru laut dan cyan',
        gradient: 'linear-gradient(120deg, #2563eb 0%, #0891b2 100%)',
    },
    {
        value: 'sunset',
        label: 'Sunset',
        description: 'Oranye hangat dan coral',
        gradient: 'linear-gradient(120deg, #ea580c 0%, #dc2626 100%)',
    },
    {
        value: 'forest',
        label: 'Forest',
        description: 'Hijau daun dan mint',
        gradient: 'linear-gradient(120deg, #15803d 0%, #0f766e 100%)',
    },
    {
        value: 'ember',
        label: 'Ember',
        description: 'Amber dan merah bata',
        gradient: 'linear-gradient(120deg, #d97706 0%, #b91c1c 100%)',
    },
    {
        value: 'slate',
        label: 'Slate',
        description: 'Abu baja dan biru dingin',
        gradient: 'linear-gradient(120deg, #475569 0%, #0f172a 100%)',
    },
    {
        value: 'aurora',
        label: 'Aurora',
        description: 'Hijau neon dan teal',
        gradient: 'linear-gradient(120deg, #10b981 0%, #84cc16 100%)',
    },
    {
        value: 'berry',
        label: 'Berry',
        description: 'Magenta dan merah berry',
        gradient: 'linear-gradient(120deg, #e11d48 0%, #be123c 100%)',
    },
    {
        value: 'cobalt',
        label: 'Cobalt',
        description: 'Biru royal dan navy',
        gradient: 'linear-gradient(120deg, #2563eb 0%, #1e3a8a 100%)',
    },
    {
        value: 'citrus',
        label: 'Citrus',
        description: 'Lime segar dan amber',
        gradient: 'linear-gradient(120deg, #84cc16 0%, #f59e0b 100%)',
    },
    {
        value: 'orchid',
        label: 'Orchid',
        description: 'Violet dan pink anggun',
        gradient: 'linear-gradient(120deg, #7c3aed 0%, #ec4899 100%)',
    },
    {
        value: 'sand',
        label: 'Sand',
        description: 'Beige hangat dan coklat muda',
        gradient: 'linear-gradient(120deg, #d6b98c 0%, #b08968 100%)',
    },
    {
        value: 'ice',
        label: 'Ice',
        description: 'Biru es dan cyan lembut',
        gradient: 'linear-gradient(120deg, #60a5fa 0%, #67e8f9 100%)',
    },
    {
        value: 'graphite',
        label: 'Graphite',
        description: 'Gunmetal dan abu netral',
        gradient: 'linear-gradient(120deg, #334155 0%, #1f2937 100%)',
    },
];

const presetMap = new Map(presets.map((preset) => [preset.value, preset]));

export default function AppearanceColorThemes({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { colorTheme, updateColorTheme } = useAppearance();

    const visiblePresets = COLOR_THEMES.map(
        (theme) =>
            presetMap.get(theme) ?? {
                value: theme,
                label: theme,
                description: 'Custom',
                gradient: 'linear-gradient(120deg, #475569 0%, #111827 100%)',
            },
    );

    return (
        <div
            className={cn(
                'grid gap-4 sm:grid-cols-2 xl:grid-cols-3',
                className,
            )}
            {...props}
        >
            {visiblePresets.map((preset) => (
                <Card
                    key={preset.value}
                    onClick={() => updateColorTheme(preset.value)}
                    className={cn(
                        'relative cursor-pointer overflow-hidden border-2 p-0 transition-all duration-200',
                        colorTheme === preset.value
                            ? 'border-primary shadow-md'
                            : 'border-muted hover:border-primary/50',
                    )}
                >
                    <div
                        className="h-14 w-full"
                        style={{ background: preset.gradient }}
                    />
                    <div className="space-y-1 p-3">
                        <p className="text-sm font-semibold">{preset.label}</p>
                        <p className="text-xs text-muted-foreground">
                            {preset.description}
                        </p>
                    </div>
                    {colorTheme === preset.value ? (
                        <span className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-white/90 ring-2 ring-primary/60" />
                    ) : null}
                </Card>
            ))}
        </div>
    );
}
