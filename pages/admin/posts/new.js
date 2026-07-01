import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import PostEditor from '../../../components/admin/PostEditor';

export default function NewPostPage() {
  const router = useRouter();
  return (
    <AdminLayout title="New Post">
      <PostEditor
        mode="create"
        onSaved={(post) => router.replace(`/admin/posts/${post.id}`)}
      />
    </AdminLayout>
  );
}
