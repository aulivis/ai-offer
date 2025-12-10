'use client';

import { useState } from 'react';
import { ThumbsUp } from 'lucide-react';

interface VideoCommentsProps {
  videoId: string;
}

export function VideoComments({ videoId: _videoId }: VideoCommentsProps) {
  const [comment, setComment] = useState('');
  const [comments] = useState([
    {
      id: 1,
      author: 'Nagy Péter',
      avatar: 'NP',
      timeAgo: '2 napja',
      text: 'Nagyon hasznos videó! Végre érthető magyarázat az ajánlatkészítésről.',
      likes: 8,
    },
    {
      id: 2,
      author: 'Kovács Anna',
      avatar: 'KA',
      timeAgo: '5 napja',
      text: 'Köszönöm a részletes útmutatót! Sokat segített.',
      likes: 5,
    },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would submit to your backend
    setComment('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 mb-12">
      <div className="bg-bg-muted rounded-2xl border-2 border-border p-8">
        <h2 className="text-2xl font-bold text-fg mb-6">
          Hozzászólások <span className="text-fg-muted font-normal">({comments.length})</span>
        </h2>

        {/* Add comment */}
        <div className="mb-8">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-ink font-bold flex-shrink-0">
              U
            </div>
            <div className="flex-1">
              <textarea
                placeholder="Add hozzá a véleményedet..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-4 border-2 border-border rounded-xl resize-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all min-h-[100px]"
                rows={3}
              ></textarea>
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  className="bg-primary text-primary-ink px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors min-h-[44px]"
                >
                  Hozzászólás
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Comment list */}
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-ink font-bold flex-shrink-0">
                {comment.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-fg">{comment.author}</span>
                  <span className="text-sm text-fg-muted">{comment.timeAgo}</span>
                </div>
                <p className="text-fg mb-2">{comment.text}</p>
                <div className="flex items-center gap-4">
                  <button className="text-sm text-fg-muted hover:text-primary flex items-center gap-1 min-h-[44px]">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{comment.likes}</span>
                  </button>
                  <button className="text-sm text-fg-muted hover:text-primary min-h-[44px]">
                    Válasz
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
