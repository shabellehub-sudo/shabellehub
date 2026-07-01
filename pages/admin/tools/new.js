// pages/admin/tools/new.js
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import ToolEditor from '../../../components/admin/ToolEditor';

export default function NewToolPage() {
  const router = useRouter();
  return (
    <AdminLayout title="New Tool">
      <ToolEditor
        mode="create"
        onSaved={(tool) => {
          if (tool?.deleted) { router.replace('/admin/tools'); return; }
          if (tool?.id)      { router.replace(`/admin/tools/${tool.id}`); return; }
        }}
      />
    </AdminLayout>
  );
}
