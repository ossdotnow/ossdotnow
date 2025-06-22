'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Edit, FolderPlus, Trash2, Search, Tag, Folder } from 'lucide-react';
import { Switch } from '@workspace/ui/components/switch';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Badge } from '@workspace/ui/components/badge';
import { useState } from 'react';

// Dummy data - replace with tRPC queries when API is available
const projectTypes = [
  { id: '1', name: 'fintech', projectCount: 12, enabled: true },
  { id: '2', name: 'healthtech', projectCount: 8, enabled: true },
  { id: '3', name: 'edtech', projectCount: 15, enabled: true },
  { id: '4', name: 'developer-tools', projectCount: 24, enabled: true },
  { id: '5', name: 'analytics', projectCount: 6, enabled: true },
  { id: '6', name: 'e-commerce', projectCount: 18, enabled: false },
  { id: '7', name: 'social-media', projectCount: 9, enabled: true },
  { id: '8', name: 'productivity', projectCount: 11, enabled: true },
];

const tags = [
  { id: '1', name: 'web', useCount: 23, enabled: true },
  { id: '2', name: 'mobile', useCount: 18, enabled: true },
  { id: '3', name: 'ai', useCount: 45, enabled: true },
  { id: '4', name: 'saas', useCount: 32, enabled: true },
  { id: '5', name: 'crypto', useCount: 12, enabled: true },
  { id: '6', name: 'open-source', useCount: 28, enabled: true },
  { id: '7', name: 'api', useCount: 19, enabled: true },
  { id: '8', name: 'blockchain', useCount: 8, enabled: false },
  { id: '9', name: 'b2b', useCount: 14, enabled: true },
  { id: '10', name: 'b2c', useCount: 21, enabled: true },
];

export default function AdminCategoriesDashboard() {
  const [searchTypes, setSearchTypes] = useState('');
  const [searchTags, setSearchTags] = useState('');

  // Filter project types and tags based on search
  const filteredTypes = projectTypes.filter((type) =>
    type.name.toLowerCase().includes(searchTypes.toLowerCase()),
  );

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchTags.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground">Manage project categories and tags</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Project Types</CardTitle>
                <CardDescription>Manage project type categories</CardDescription>
              </div>
              <Badge variant="outline" className="text-blue-600">
                <Folder className="mr-1 h-3 w-3" />
                {projectTypes.length} Types
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center space-x-2">
              <Search className="text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search types..."
                value={searchTypes}
                onChange={(e) => setSearchTypes(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="space-y-4">
              {filteredTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium capitalize">{type.name.replace('-', ' ')}</span>
                    <Badge variant="secondary">{type.projectCount} projects</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked={type.enabled} />
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                <FolderPlus className="mr-2 h-4 w-4" />
                Add Project Type
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tags</CardTitle>
                <CardDescription>Manage available project tags</CardDescription>
              </div>
              <Badge variant="outline" className="text-green-600">
                <Tag className="mr-1 h-3 w-3" />
                {tags.length} Tags
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center space-x-2">
              <Search className="text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tags..."
                value={searchTags}
                onChange={(e) => setSearchTags(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="space-y-4">
              {filteredTags.map((tag) => (
                <div key={tag.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge>{tag.name}</Badge>
                    <span className="text-muted-foreground text-sm">{tag.useCount} uses</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked={tag.enabled} />
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                Add New Tag
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
