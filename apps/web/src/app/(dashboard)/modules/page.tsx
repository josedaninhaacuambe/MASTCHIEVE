'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { levelLabel, cn } from '@/lib/utils';
import {
  Waves, Plus, X, ChevronDown, ChevronUp, Users, CheckCircle, Clock, AlertCircle,
  ArrowUp, ArrowDown, ChevronRight, Play, Trash2, ExternalLink, Video, Link2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

// ─── Ocean Wave Loader ────────────────────────────────────────────────────────

const BAR_DELAYS = [0, 0.14, 0.28, 0.42, 0.56, 0.70, 0.84, 0.70, 0.56, 0.42, 0.28, 0.14];
const BAR_COLORS = [
  'from-blue-300 to-blue-500',
  'from-blue-400 to-indigo-500',
  'from-indigo-400 to-blue-600',
  'from-blue-500 to-indigo-600',
  'from-indigo-500 to-blue-700',
  'from-blue-600 to-indigo-700',
  'from-indigo-600 to-blue-700',
  'from-blue-500 to-indigo-600',
  'from-indigo-400 to-blue-600',
  'from-blue-400 to-indigo-500',
  'from-blue-300 to-blue-500',
  'from-indigo-300 to-blue-400',
];

function WaveLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-24 select-none">
      {/* Glow rings */}
      <div className="relative mb-8">
        <div
          className="absolute inset-0 rounded-full bg-blue-400/20"
          style={{ animation: 'wave-ripple 2.4s ease-in-out infinite', transform: 'scale(1.5)' }}
        />
        <div
          className="absolute inset-0 rounded-full bg-blue-500/15"
          style={{ animation: 'wave-ripple 2.4s ease-in-out infinite 0.8s', transform: 'scale(1.9)' }}
        />

        {/* Central badge */}
        <div
          className="relative w-20 h-20 rounded-full flex items-center justify-center overflow-hidden shadow-2xl shadow-blue-500/40"
          style={{
            background: 'linear-gradient(135deg, #1A3A9C 0%, #1A56DB 60%, #3B82F6 100%)',
            animation: 'wave-float 3s ease-in-out infinite',
          }}
        >
          {/* Animated water fill inside badge */}
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden" style={{ height: '55%' }}>
            <svg
              viewBox="0 0 200 40"
              className="absolute bottom-0 w-[200%]"
              style={{ animation: 'wave-svg 2s linear infinite' }}
              preserveAspectRatio="none"
            >
              <path
                d="M0,20 Q25,5 50,20 T100,20 T150,20 T200,20 V40 H0 Z"
                fill="rgba(255,255,255,0.25)"
              />
              <path
                d="M0,25 Q25,12 50,25 T100,25 T150,25 T200,25 V40 H0 Z"
                fill="rgba(255,255,255,0.15)"
              />
            </svg>
          </div>
          <Waves className="w-8 h-8 text-white relative z-10 drop-shadow" />
        </div>
      </div>

      {/* Wave equalizer bars */}
      <div className="flex items-end gap-1" style={{ height: 48 }}>
        {BAR_DELAYS.map((delay, i) => (
          <div
            key={i}
            className={`w-2 rounded-full bg-gradient-to-t ${BAR_COLORS[i]}`}
            style={{
              height: 44,
              transformOrigin: 'bottom',
              animation: `wave-bar 1.3s ease-in-out infinite`,
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </div>

      {/* Text */}
      <div className="mt-7 text-center space-y-1">
        <p
          className="text-blue-700 font-semibold text-sm tracking-wide"
          style={{ animation: 'wave-float 3s ease-in-out infinite 0.5s' }}
        >
          A carregar módulos...
        </p>
        <p className="text-gray-400 text-xs">Preparando o currículo progressivo de natação</p>
      </div>

      {/* Floating bubbles */}
      <div className="relative w-40 h-8 mt-4 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-blue-400/30 border border-blue-400/20"
            style={{
              width: 6 + i * 2,
              height: 6 + i * 2,
              left: `${10 + i * 18}%`,
              bottom: 0,
              animation: `wave-float ${1.5 + i * 0.4}s ease-in-out infinite`,
              animationDelay: `${i * 0.25}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

const levelOptions = ['BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED', 'COMPETITIVE'];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  NOT_STARTED:  { label: 'Não iniciado', color: 'bg-gray-100 text-gray-500',    icon: Clock },
  IN_PROGRESS:  { label: 'Em progresso', color: 'bg-blue-100 text-blue-700',    icon: Clock },
  COMPLETED:    { label: 'Concluído',    color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  NEEDS_REVIEW: { label: 'A rever',      color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
};

// ─── YouTube helpers ──────────────────────────────────────────────────────────

function getYoutubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?(?:.*&)?v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function isYoutube(url: string) {
  return !!getYoutubeId(url);
}

// ─── Video Player Modal ───────────────────────────────────────────────────────

function VideoPlayerModal({ video, onClose }: { video: any; onClose: () => void }) {
  const ytId = video.youtubeId ?? getYoutubeId(video.url);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-white">
            <Video className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-sm truncate max-w-md">{video.title}</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Player */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          {ytId ? (
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 gap-4">
              <ExternalLink className="w-10 h-10 text-gray-400" />
              <p className="text-gray-300 text-sm">Este vídeo está num serviço externo</p>
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition"
              >
                <ExternalLink className="w-4 h-4" /> Abrir em nova aba
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        {video.description && (
          <div className="px-5 py-3 border-t border-white/10">
            <p className="text-gray-400 text-xs leading-relaxed">{video.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Video Thumbnail Card ─────────────────────────────────────────────────────

function VideoCard({
  video, moduleId, canManage, onPlay,
}: {
  video: any; moduleId: string; canManage: boolean; onPlay: (v: any) => void;
}) {
  const qc = useQueryClient();
  const ytId = video.youtubeId ?? getYoutubeId(video.url);

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/swimming-modules/${moduleId}/videos/${video.id}`),
    onSuccess: () => { toast.success('Vídeo removido'); qc.invalidateQueries({ queryKey: ['swimming-modules'] }); },
    onError: () => toast.error('Erro ao remover vídeo'),
  });

  return (
    <div className="group relative bg-gray-50 border border-gray-200 rounded-xl overflow-hidden hover:border-mastchieve-300 transition">
      {/* Thumbnail */}
      <button
        onClick={() => onPlay(video)}
        className="relative w-full block"
        style={{ paddingBottom: '56.25%' }}
      >
        {ytId ? (
          <>
            <img
              src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
              alt={video.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition flex items-center justify-center">
              <div className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-500 transition flex items-center justify-center shadow-lg">
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </div>
            </div>
            <div className="absolute top-2 left-2">
              <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">YT</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <div className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </button>

      {/* Info row */}
      <div className="px-3 py-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-800 leading-tight truncate">{video.title}</p>
          {video.description && (
            <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{video.description}</p>
          )}
          {!ytId && (
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-blue-500 hover:underline flex items-center gap-0.5 mt-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <Link2 className="w-2.5 h-2.5" /> Link externo
            </a>
          )}
        </div>
        {canManage && (
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="p-1 text-gray-300 hover:text-red-500 transition flex-shrink-0 mt-0.5"
            title="Remover vídeo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Add Video Form ───────────────────────────────────────────────────────────

function AddVideoForm({ moduleId, onDone }: { moduleId: string; onDone: () => void }) {
  const qc = useQueryClient();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const ytPreview = getYoutubeId(url);

  const mutation = useMutation({
    mutationFn: () => api.post(`/swimming-modules/${moduleId}/videos`, { url, title, description: description || undefined }),
    onSuccess: () => {
      toast.success('Vídeo adicionado');
      qc.invalidateQueries({ queryKey: ['swimming-modules'] });
      onDone();
    },
    onError: (e: any) => toast.error('Erro ao adicionar vídeo', e?.response?.data?.message),
  });

  return (
    <div className="border border-mastchieve-200 rounded-xl p-4 bg-mastchieve-50/50 space-y-3">
      <div className="flex items-center gap-2 text-mastchieve-700 mb-1">
        <Video className="w-4 h-4" />
        <span className="text-xs font-semibold">Adicionar Vídeo</span>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">URL do vídeo <span className="text-red-400">*</span></label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=... ou outro link"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-mastchieve-400 bg-white"
        />
        {ytPreview && (
          <p className="text-[11px] text-green-600 mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> YouTube detectado — será incorporado automaticamente
          </p>
        )}
        {url && !ytPreview && isYoutube(url) === false && url.startsWith('http') && (
          <p className="text-[11px] text-blue-500 mt-1 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> Vídeo externo — abrirá em nova aba
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Título <span className="text-red-400">*</span></label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Técnica de Pernada Crol"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-mastchieve-400 bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Descrição (opcional)</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Breve descrição do conteúdo do vídeo"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-mastchieve-400 bg-white"
        />
      </div>

      {/* Preview thumbnail */}
      {ytPreview && (
        <div className="relative rounded-lg overflow-hidden" style={{ height: 80 }}>
          <img
            src={`https://img.youtube.com/vi/${ytPreview}/mqdefault.jpg`}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
          </div>
          <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">YT</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onDone}
          className="flex-1 text-xs py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={!url || !title || mutation.isPending}
          className="flex-1 text-xs py-2 bg-mastchieve-600 hover:bg-mastchieve-700 disabled:opacity-50 text-white rounded-lg transition font-medium"
        >
          {mutation.isPending ? 'A adicionar...' : 'Adicionar'}
        </button>
      </div>
    </div>
  );
}

// ─── Videos Section ───────────────────────────────────────────────────────────

function VideosSection({ module, canManage }: { module: any; canManage: boolean }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<any>(null);
  const videos: any[] = module.videos ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Video className="w-3.5 h-3.5 text-mastchieve-500" />
          <p className="text-xs font-semibold text-gray-700">Vídeos explicativos</p>
          {videos.length > 0 && (
            <span className="text-[10px] bg-mastchieve-100 text-mastchieve-700 px-1.5 py-0.5 rounded-full font-medium">
              {videos.length}
            </span>
          )}
        </div>
        {canManage && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 text-[11px] text-mastchieve-600 hover:text-mastchieve-700 font-medium transition"
          >
            <Plus className="w-3 h-3" /> Adicionar vídeo
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="mb-3">
          <AddVideoForm moduleId={module.id} onDone={() => setShowAddForm(false)} />
        </div>
      )}

      {videos.length === 0 && !showAddForm ? (
        <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400">
          <Video className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-xs">Nenhum vídeo adicionado</p>
          {canManage && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-2 text-xs text-mastchieve-600 hover:underline"
            >
              Adicionar primeiro vídeo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {videos.map((v) => (
            <VideoCard
              key={v.id}
              video={v}
              moduleId={module.id}
              canManage={canManage}
              onPlay={setPlayingVideo}
            />
          ))}
        </div>
      )}

      {playingVideo && (
        <VideoPlayerModal video={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}
    </div>
  );
}

// ─── Create Module Modal ──────────────────────────────────────────────────────

function CreateModuleModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: '', description: '', level: 'BEGINNER', order: 1, skills: '' as string,
  });

  const mutation = useMutation({
    mutationFn: () => api.post('/swimming-modules', {
      ...form,
      skills: form.skills ? form.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
    }),
    onSuccess: () => { toast.success('Módulo criado'); onSuccess(); onClose(); },
    onError: (e: any) => toast.error('Erro ao criar módulo', e?.response?.data?.message),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Novo Módulo</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome <span className="text-red-400">*</span></label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mastchieve-500"
              placeholder="Ex: Flutuação e Equilíbrio" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nível</label>
              <select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mastchieve-500">
                {levelOptions.map((l) => <option key={l} value={l}>{levelLabel(l)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
              <input type="number" min={1} value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mastchieve-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Competências (separadas por vírgula)</label>
            <input value={form.skills} onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mastchieve-500"
              placeholder="Ex: Respiração, Pernada, Braçada" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea value={form.description} rows={2}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mastchieve-500 resize-none" />
          </div>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.name || mutation.isPending}
            className="flex-1 bg-mastchieve-600 hover:bg-mastchieve-700 text-white py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {mutation.isPending ? 'A criar...' : 'Criar Módulo'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Journey node ─────────────────────────────────────────────────────────────

function JourneyNode({ module, isLast }: { module: any; isLast: boolean }) {
  const levelDot: Record<string, string> = {
    BEGINNER: 'border-green-400 bg-green-50 text-green-700',
    ELEMENTARY: 'border-sky-400 bg-sky-50 text-sky-700',
    INTERMEDIATE: 'border-purple-400 bg-purple-50 text-purple-700',
    ADVANCED: 'border-orange-400 bg-orange-50 text-orange-700',
    COMPETITIVE: 'border-red-400 bg-red-50 text-red-700',
  };
  const inProgress = module.progressStats?.inProgress ?? 0;
  const completed = module.progressStats?.completed ?? 0;
  const videoCount = (module.videos ?? []).length;
  return (
    <div className="flex items-center flex-shrink-0">
      <div className="flex flex-col items-center w-[88px]">
        <div className={cn('w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-sm',
          levelDot[module.level] ?? 'border-gray-300 bg-gray-50 text-gray-600')}>
          {module.order}
        </div>
        <div className="text-[11px] font-medium text-gray-700 mt-1.5 max-w-[80px] text-center leading-tight line-clamp-2">
          {module.name}
        </div>
        {videoCount > 0 && (
          <div className="text-[10px] text-mastchieve-500 mt-0.5 flex items-center gap-0.5">
            <Video className="w-2.5 h-2.5" /> {videoCount} vídeo{videoCount !== 1 ? 's' : ''}
          </div>
        )}
        {inProgress > 0 && <div className="text-[10px] text-blue-500">{inProgress} em progresso</div>}
        {completed > 0 && <div className="text-[10px] text-green-600">{completed} concluídos</div>}
      </div>
      {!isLast && (
        <div className="flex items-center flex-shrink-0 -mt-8">
          <div className="w-6 h-0.5 bg-gray-200" />
          <ChevronRight className="w-3 h-3 text-gray-300 -ml-1" />
        </div>
      )}
    </div>
  );
}

// ─── Module Card ──────────────────────────────────────────────────────────────

function ModuleCard({ module, isAdmin, isInstructor, totalModules }: {
  module: any; isAdmin: boolean; isInstructor: boolean; totalModules: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();
  const canManageVideos = isAdmin || isInstructor;

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/swimming-modules/${module.id}`),
    onSuccess: () => { toast.success('Módulo arquivado'); qc.invalidateQueries({ queryKey: ['swimming-modules'] }); },
    onError: () => toast.error('Erro ao arquivar módulo'),
  });

  const reorderMutation = useMutation({
    mutationFn: (newOrder: number) => api.patch(`/swimming-modules/${module.id}`, { order: newOrder }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['swimming-modules'] }); },
    onError: () => toast.error('Erro ao reordenar módulo'),
  });

  const totalProgress = module.progressStats?.total ?? 0;
  const completedProgress = module.progressStats?.completed ?? 0;
  const completionRate = totalProgress > 0 ? Math.round((completedProgress / totalProgress) * 100) : 0;
  const videoCount = (module.videos ?? []).length;

  const levelColors: Record<string, string> = {
    BEGINNER: 'bg-green-100 text-green-700',
    ELEMENTARY: 'bg-blue-100 text-blue-700',
    INTERMEDIATE: 'bg-purple-100 text-purple-700',
    ADVANCED: 'bg-orange-100 text-orange-700',
    COMPETITIVE: 'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-mastchieve-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Waves className="w-5 h-5 text-mastchieve-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">#{module.order}</span>
                <h3 className="font-semibold text-gray-900 text-sm">{module.name}</h3>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', levelColors[module.level] ?? 'bg-gray-100 text-gray-600')}>
                  {levelLabel(module.level)}
                </span>
                {videoCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-mastchieve-600 bg-mastchieve-50 px-2 py-0.5 rounded-full border border-mastchieve-100">
                    <Video className="w-3 h-3" /> {videoCount} vídeo{videoCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isAdmin && (
              <>
                <button onClick={() => module.order > 1 && reorderMutation.mutate(module.order - 1)}
                  disabled={module.order <= 1 || reorderMutation.isPending}
                  className="p-1 text-gray-300 hover:text-mastchieve-500 disabled:opacity-30 transition" title="Mover para cima">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => module.order < totalModules && reorderMutation.mutate(module.order + 1)}
                  disabled={module.order >= totalModules || reorderMutation.isPending}
                  className="p-1 text-gray-300 hover:text-mastchieve-500 disabled:opacity-30 transition" title="Mover para baixo">
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button onClick={() => setExpanded((v) => !v)} className="p-1 text-gray-400 hover:text-gray-600 transition">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {module.description && (
          <p className="text-xs text-gray-500 mt-3 leading-relaxed">{module.description}</p>
        )}

        {/* Progress bar */}
        {totalProgress > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {completedProgress}/{totalProgress} atletas</span>
              <span className={completionRate >= 80 ? 'text-green-600 font-medium' : 'text-gray-400'}>{completionRate}% concluídos</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', completionRate >= 80 ? 'bg-green-400' : 'bg-mastchieve-500')}
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
          {/* Skills */}
          {module.skills?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Competências</p>
              <div className="flex flex-wrap gap-1.5">
                {module.skills.map((skill: string, i: number) => (
                  <span key={i} className="text-xs bg-mastchieve-50 text-mastchieve-700 px-2.5 py-1 rounded-full border border-mastchieve-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Progress stats */}
          <div className="flex items-center gap-2 text-xs">
            <span className={cn('px-2 py-1 rounded-full', statusConfig.IN_PROGRESS.color)}>
              {module.progressStats?.inProgress ?? 0} em progresso
            </span>
            <span className={cn('px-2 py-1 rounded-full', statusConfig.COMPLETED.color)}>
              {module.progressStats?.completed ?? 0} concluídos
            </span>
          </div>

          {/* Videos section */}
          <div className="border-t border-gray-100 pt-4">
            <VideosSection module={module} canManage={canManageVideos} />
          </div>

          {isAdmin && (
            <div className="border-t border-gray-100 pt-3">
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="text-xs text-red-500 hover:text-red-700 hover:underline transition"
              >
                {deleteMutation.isPending ? 'A arquivar...' : 'Arquivar módulo'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ModulesPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isInstructor = user?.role === 'INSTRUCTOR';
  const [levelFilter, setLevelFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data: modules, isLoading } = useQuery({
    queryKey: ['swimming-modules', levelFilter],
    queryFn: async () => {
      const params = levelFilter ? `?level=${levelFilter}` : '';
      const { data } = await api.get(`/swimming-modules${params}`);
      return data.data ?? [];
    },
  });

  const stats = {
    total: modules?.length ?? 0,
    byLevel: levelOptions.reduce((acc, l) => {
      acc[l] = (modules ?? []).filter((m: any) => m.level === l).length;
      return acc;
    }, {} as Record<string, number>),
  };

  return (
    <div className="space-y-6">
      {showCreate && (
        <CreateModuleModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['swimming-modules'] })}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Módulos de Natação</h1>
          <p className="text-gray-500 text-sm mt-1">Currículo técnico progressivo com vídeos explicativos</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-mastchieve-600 hover:bg-mastchieve-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" /> Novo Módulo
          </button>
        )}
      </div>

      {/* Journey panel */}
      {(modules ?? []).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Waves className="w-4 h-4 text-mastchieve-500" />
            <h3 className="text-sm font-semibold text-gray-900">Jornada de Progressão</h3>
            <span className="text-xs text-gray-400 ml-auto">{modules?.length} módulos</span>
          </div>
          <div className="overflow-x-auto pb-1 no-scrollbar">
            <div className="flex items-start gap-0">
              {(modules ?? [])
                .slice()
                .sort((a: any, b: any) => a.order - b.order)
                .map((mod: any, i: number, arr: any[]) => (
                  <JourneyNode key={mod.id} module={mod} isLast={i === arr.length - 1} />
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Level filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 flex-wrap">
        <span className="text-sm text-gray-500">Nível:</span>
        <button
          onClick={() => setLevelFilter('')}
          className={cn('text-xs px-3 py-1.5 rounded-full font-medium transition',
            levelFilter === '' ? 'bg-mastchieve-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
        >
          Todos ({stats.total})
        </button>
        {levelOptions.map((l) => (
          <button key={l}
            onClick={() => setLevelFilter(l)}
            className={cn('text-xs px-3 py-1.5 rounded-full font-medium transition',
              levelFilter === l ? 'bg-mastchieve-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
          >
            {levelLabel(l)} ({stats.byLevel[l] ?? 0})
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <WaveLoader />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(modules ?? []).map((mod: any) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              isAdmin={isAdmin}
              isInstructor={isInstructor}
              totalModules={modules?.length ?? 0}
            />
          ))}
        </div>
      )}

      {!isLoading && (modules ?? []).length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Waves className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum módulo encontrado</p>
          {isAdmin && (
            <button onClick={() => setShowCreate(true)} className="mt-3 text-mastchieve-600 text-sm hover:underline">
              Criar primeiro módulo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
