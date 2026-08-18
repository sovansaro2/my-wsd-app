import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vstwhhuqgeimssqxfmij.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzdHdoaHVxZ2VpbXNzcXhmbWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MjU2NjEsImV4cCI6MjEwMjUwMTY2MX0.QVzdZkx3kNw3sGvnAK8E8My1szvDpz3Qario2XuPmmI'
);

async function fix() {
  const { data: posts } = await supabase.from('posts').select('id, comments');
  
  if (posts) {
    for (const post of posts) {
      if (post.comments) {
        let parsedComments = [];
        if (typeof post.comments === 'string') {
          parsedComments = JSON.parse(post.comments);
        } else if (Array.isArray(post.comments)) {
          parsedComments = post.comments;
        }
        
        let hasChanges = false;
        const updated = parsedComments.map(c => {
          if (c.author === 'អ្នកគ្រប់គ្រង') {
            hasChanges = true;
            return { ...c, author: 'វត្តស្នាយដួច' };
          }
          return c;
        });
        
        if (hasChanges) {
          await supabase.from('posts').update({ comments: updated }).eq('id', post.id);
          console.log('Updated comments for post', post.id);
        }
      }
    }
  }
}
fix();
