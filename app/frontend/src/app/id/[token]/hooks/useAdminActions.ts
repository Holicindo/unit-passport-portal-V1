'use client';

import { useState } from 'react';
import { unitApi } from '@/lib/api';

export function useAdminActions(
  unit: any,
  loadUnitData: () => void,
  showToast: (message: string, type: 'success' | 'error' | 'info') => void,
) {
  const [editBlocks, setEditBlocks] = useState({
    spesifikasi: false, qc: false, manuals: false, ownership: false,
  });
  const [editData, setEditData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [qcUploading, setQcUploading] = useState<Record<string, boolean>>({});
  const [photoGalleryUploading, setPhotoGalleryUploading] = useState(false);
  const [manualsUploading, setManualsUploading] = useState(false);

  const handleEditChange = (fieldPath: string, value: string) => {
    setEditData((prev: any) => {
      const parts = fieldPath.split('.');
      if (parts.length === 1) return { ...prev, [fieldPath]: value };
      if (parts.length === 2) return { ...prev, [parts[0]]: { ...prev[parts[0]], [parts[1]]: value } };
      return prev;
    });
  };

  const handleSave = async (block: keyof typeof editBlocks) => {
    const noChange =
      editData.model_name === (unit?.model_name || '') &&
      editData.serial_number === (unit?.serial_number || '') &&
      editData.warranty_expiry === (unit?.warranty_expiry || '') &&
      editData.diagram_image_url === (unit?.diagram_image_url || '') &&
      JSON.stringify(editData.specs) === JSON.stringify(unit?.specs);

    if (noChange) { showToast('Tidak ada perubahan', 'info'); return; }

    setIsSaving(true);
    try {
      if (unit?.id) {
        const payload: any = {
          current_client_id: editData.current_client?.id,
          outlet_branch: editData.outlet_branch,
          city: editData.city,
        };
        if (editData.model_name !== undefined) payload.model_name = editData.model_name;
        if (editData.specs !== undefined) payload.specs = editData.specs;
        if (editData.diagram_image_url !== undefined) payload.diagram_image_url = editData.diagram_image_url;
        if (editData.warranty_expiry !== undefined) payload.warranty_expiry = editData.warranty_expiry;
        await unitApi.update(unit.id, payload);
        showToast('Perubahan berhasil disimpan!', 'success');
        loadUnitData();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal menyimpan perubahan.';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = (block: keyof typeof editBlocks) => {
    if (!editBlocks[block]) {
      setEditData({ ...unit, current_client: { ...unit?.current_client }, outlet_branch: unit?.outlet_branch || '', city: unit?.city || '' });
    } else {
      handleSave(block);
    }
    setEditBlocks(prev => ({ ...prev, [block]: !prev[block] }));
  };

  const cancelEdit = (block: keyof typeof editBlocks) => {
    setEditBlocks(prev => ({ ...prev, [block]: false }));
  };

  const handleQcFileUpload = async (fieldKey: string, file: File) => {
    setQcUploading(prev => ({ ...prev, [fieldKey]: true }));
    try {
      const { data } = await unitApi.uploadMedia([file]);
      const uploadedUrl = data?.[0]?.url || data?.urls?.[0] || '';
      if (uploadedUrl) {
        handleEditChange(`specs.${fieldKey}`, uploadedUrl);
        if (unit?.id) {
          const baseSpecs = (editData.specs && Object.keys(editData.specs).length > 0) ? { ...editData.specs } : (unit?.specs ? { ...unit.specs } : {});
          baseSpecs[fieldKey] = uploadedUrl;
          try {
            await unitApi.update(unit.id, { specs: baseSpecs });
            showToast('File berhasil diupload dan disimpan.', 'success');
            loadUnitData();
          } catch { showToast('File terupload tapi gagal disimpan ke unit.', 'info'); }
        }
      }
    } catch { showToast('Gagal mengupload file.', 'error'); }
    finally { setQcUploading(prev => ({ ...prev, [fieldKey]: false })); }
  };

  const handlePhotoGalleryUpload = async (files: FileList) => {
    setPhotoGalleryUploading(true);
    try {
      const { data } = await unitApi.uploadMedia(Array.from(files));
      const urls: string[] = Array.isArray(data) ? data.map((d: any) => d?.url || d).filter(Boolean) : (data?.urls || []);
      const existing = editData.specs?.photo_gallery ? editData.specs.photo_gallery.split(',').filter(Boolean) : [];
      handleEditChange('specs.photo_gallery', [...existing, ...urls].join(','));
    } catch { showToast('Gagal mengupload foto.', 'error'); }
    finally { setPhotoGalleryUploading(false); }
  };

  const handleManualsUpload = async (files: FileList) => {
    setManualsUploading(true);
    try {
      const { data } = await unitApi.uploadMedia(Array.from(files));
      const urls: string[] = Array.isArray(data) ? data.map((d: any) => d?.url || d).filter(Boolean) : (data?.urls || []);
      const existing = editData.specs?.manuals_urls ? editData.specs.manuals_urls.split(',').filter(Boolean) : [];
      handleEditChange('specs.manuals_urls', [...existing, ...urls].join(','));
    } catch { showToast('Gagal mengupload file manuals.', 'error'); }
    finally { setManualsUploading(false); }
  };

  return {
    editBlocks, editData, isSaving, qcUploading, photoGalleryUploading, manualsUploading,
    toggleEdit, cancelEdit, handleSave, handleEditChange,
    handleQcFileUpload, handlePhotoGalleryUpload, handleManualsUpload,
  };
}
