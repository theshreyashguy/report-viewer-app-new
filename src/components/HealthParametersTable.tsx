
import React, { useState } from 'react';
import { FileText, Edit2, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { HealthParameter } from '@/types/health';

interface HealthParametersTableProps {
  parameters: HealthParameter[];
  onParameterUpdate: (id: string, updates: Partial<HealthParameter>) => void;
  onParameterDelete: (id: string) => void;
}

const HealthParametersTable: React.FC<HealthParametersTableProps> = ({
  parameters,
  onParameterUpdate,
  onParameterDelete,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<HealthParameter>>({});

  const handleEdit = (parameter: HealthParameter) => {
    setEditingId(parameter.id);
    setEditValues(parameter);
  };

  const handleSave = () => {
    if (editingId && editValues) {
      onParameterUpdate(editingId, editValues);
      setEditingId(null);
      setEditValues({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const updateEditValue = (field: keyof HealthParameter, value: string) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };

  if (parameters.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">No health parameters found</p>
        <p className="text-sm text-gray-500">Upload a health report to extract data</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Parameter</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Normal Range</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parameters.map((parameter) => (
            <TableRow
              key={parameter.id}
              className={parameter.isOutOfRange ? 'bg-red-50' : 'bg-green-50'}
            >
              <TableCell className="font-medium">
                {editingId === parameter.id ? (
                  <Input
                    value={editValues.name || ''}
                    onChange={(e) => updateEditValue('name', e.target.value)}
                    className="w-full"
                  />
                ) : (
                  parameter.name
                )}
              </TableCell>
              <TableCell>
                {editingId === parameter.id ? (
                  <Input
                    value={editValues.value || ''}
                    onChange={(e) => updateEditValue('value', e.target.value)}
                    className="w-20"
                  />
                ) : (
                  parameter.value
                )}
              </TableCell>
              <TableCell>
                {editingId === parameter.id ? (
                  <Input
                    value={editValues.unit || ''}
                    onChange={(e) => updateEditValue('unit', e.target.value)}
                    className="w-16"
                  />
                ) : (
                  parameter.unit
                )}
              </TableCell>
              <TableCell>
                {editingId === parameter.id ? (
                  <Input
                    value={editValues.normalRange || ''}
                    onChange={(e) => updateEditValue('normalRange', e.target.value)}
                    className="w-24"
                  />
                ) : (
                  parameter.normalRange
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{parameter.category}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={parameter.isOutOfRange ? 'destructive' : 'default'}
                >
                  {parameter.isOutOfRange ? 'Needs Attention' : 'Normal'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex space-x-1">
                  {editingId === parameter.id ? (
                    <>
                      <Button size="sm" onClick={handleSave}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(parameter)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onParameterDelete(parameter.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default HealthParametersTable;
