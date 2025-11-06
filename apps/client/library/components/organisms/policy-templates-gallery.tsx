"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/library/components/atoms/card";
import { Button } from "@/library/components/atoms/button";
import { Badge } from "@/library/components/atoms/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/library/components/atoms/tooltip";
import { POLICY_TEMPLATES, type PolicyTemplate } from "@/library/constants/policy-templates";
import { Sparkles, TrendingUp, Shield, Shuffle, Target, DollarSign } from "lucide-react";

interface PolicyTemplatesGalleryProps {
  onSelectTemplate: (template: PolicyTemplate) => void;
}

export function PolicyTemplatesGallery({ onSelectTemplate }: PolicyTemplatesGalleryProps) {
  const getTemplateIcon = (templateId: string) => {
    switch (templateId) {
      case 'conservative-preservation':
        return Shield;
      case 'aggressive-growth':
        return TrendingUp;
      case 'market-maker':
        return Shuffle;
      case 'arbitrage-hunter':
        return Target;
      case 'dca-accumulator':
        return DollarSign;
      default:
        return Sparkles;
    }
  };

  const getCategoryColor = (category: PolicyTemplate['category']) => {
    switch (category) {
      case 'conservative':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'balanced_mix':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'aggressive':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <CardTitle>Policy Templates</CardTitle>
          <Badge variant="outline" className="text-xs">Secondary</Badge>
        </div>
        <CardDescription>
          Start with a pre-built policy template and customize it to your needs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {POLICY_TEMPLATES.map((template) => {
            const Icon = getTemplateIcon(template.id);
            return (
              <TooltipProvider key={template.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                              <Icon className="h-4 w-4" />
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={getCategoryColor(template.category)}
                          >
                            {template.category.replace('_', ' ')}
                          </Badge>
                        </div>
                        <CardTitle className="text-sm font-semibold">{template.name}</CardTitle>
                        <CardDescription className="text-xs line-clamp-2">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => onSelectTemplate(template)}
                        >
                          Use Template
                        </Button>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-xs">{template.preview}</p>
                    <div className="mt-2 pt-2 border-t text-xs space-y-1">
                      <p>Target Return: {template.policyDocument.investment_strategy.target_annual_return}%</p>
                      <p>Max Position: {template.policyDocument.risk_management.max_position_size_percent}%</p>
                      <p>Trading Frequency: {template.policyDocument.trading_preferences.frequency_minutes}min</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
