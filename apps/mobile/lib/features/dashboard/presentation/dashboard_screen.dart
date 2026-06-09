import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/hive_storage.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen>
    with TickerProviderStateMixin {
  Map<String, dynamic>? _data;
  bool _loading = true;
  late AnimationController _pulseCtrl;
  late AnimationController _slideCtrl;
  late Animation<double> _slideAnim;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 2))
      ..repeat(reverse: true);
    _slideCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _slideAnim = CurvedAnimation(parent: _slideCtrl, curve: Curves.easeOutCubic);
    _load();
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _slideCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final cached = HiveStorage.getCache('student_dashboard');
    if (cached != null) {
      setState(() { _data = Map<String, dynamic>.from(cached); _loading = false; });
      _slideCtrl.forward();
    }
    try {
      final api = ref.read(apiClientProvider);
      final user = HiveStorage.user;
      final studentId = user?['profile']?['id'];
      if (studentId == null) return;

      final [perf, balance] = await Future.wait([
        api.get('/students/$studentId/performance'),
        api.get('/financial/students/$studentId/balance'),
      ]);

      final data = {
        'performance': perf.data['data'],
        'balance': balance.data['data'],
      };
      await HiveStorage.cache('student_dashboard', data, ttl: const Duration(hours: 1));
      if (mounted) {
        setState(() { _data = data; _loading = false; });
        _slideCtrl.forward(from: 0);
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  // --- Computed engagement values ---
  int get _streak {
    final attendance = _data?['performance']?['attendance'] as List? ?? [];
    int s = 0;
    for (final a in attendance) {
      if (a['status'] == 'PRESENT') { s++; } else { break; }
    }
    return s;
  }

  int get _weeklyPresent {
    final attendance = _data?['performance']?['attendance'] as List? ?? [];
    final since = DateTime.now().subtract(const Duration(days: 7));
    return attendance.where((a) {
      final d = DateTime.tryParse(a['markedAt'] ?? '');
      return d != null && d.isAfter(since) && a['status'] == 'PRESENT';
    }).length;
  }

  double get _moduleProgress {
    final progress = _data?['performance']?['progress'] as List? ?? [];
    if (progress.isEmpty) return 0;
    final done = progress.where((p) => p['status'] == 'COMPLETED').length;
    return done / progress.length;
  }

  Map<String, dynamic>? get _nextUnlock {
    final progress = _data?['performance']?['progress'] as List? ?? [];
    try {
      return progress.firstWhere(
        (p) => p['status'] == 'IN_PROGRESS',
        orElse: () => progress.firstWhere(
          (p) => p['status'] == 'NOT_STARTED',
          orElse: () => null,
        ),
      ) as Map<String, dynamic>?;
    } catch (_) { return null; }
  }

  double get _avgScore => (_data?['performance']?['avgScore'] as num?)?.toDouble() ?? 0;
  double get _attendanceRate => (_data?['performance']?['attendanceRate'] as num?)?.toDouble() ?? 0;

  bool get _isPersonalBest {
    final records = _data?['performance']?['records'] as List? ?? [];
    if (records.length < 2) return false;
    final latest = (records.first['overallScore'] as num?)?.toDouble() ?? 0;
    final max = records.skip(1).map((r) => (r['overallScore'] as num?)?.toDouble() ?? 0).fold(0.0, (a, b) => a > b ? a : b);
    return latest > max && latest > 0;
  }

  @override
  Widget build(BuildContext context) {
    final user = HiveStorage.user;
    final profile = user?['profile'] as Map? ?? {};
    final firstName = profile['firstName'] as String? ?? 'Atleta';
    final hour = DateTime.now().hour;
    final greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

    return Scaffold(
      backgroundColor: const Color(0xFFF0F4FF),
      body: _loading
          ? _buildSkeleton()
          : RefreshIndicator(
              onRefresh: _load,
              color: const Color(0xFF1A56DB),
              child: CustomScrollView(
                slivers: [
                  // --- HERO HEADER ---
                  SliverToBoxAdapter(child: _buildHero(greeting, firstName)),

                  // --- CONTENT ---
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate([
                        const SizedBox(height: 16),

                        // Streak + Weekly Goal row
                        SlideTransition(
                          position: Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero)
                              .animate(_slideAnim),
                          child: FadeTransition(
                            opacity: _slideAnim,
                            child: Row(children: [
                              Expanded(child: _StreakCard(streak: _streak, pulse: _pulseCtrl)),
                              const SizedBox(width: 12),
                              Expanded(child: _WeeklyGoalCard(present: _weeklyPresent, goal: 4)),
                            ]),
                          ),
                        ),

                        const SizedBox(height: 12),

                        // Progress ring + stats
                        SlideTransition(
                          position: Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero)
                              .animate(CurvedAnimation(parent: _slideCtrl, curve: const Interval(0.1, 1.0, curve: Curves.easeOutCubic))),
                          child: FadeTransition(
                            opacity: _slideAnim,
                            child: _ProgressAndStatsRow(
                              progress: _moduleProgress,
                              avgScore: _avgScore,
                              attendanceRate: _attendanceRate,
                            ),
                          ),
                        ),

                        // Next unlock teaser
                        if (_nextUnlock != null) ...[
                          const SizedBox(height: 12),
                          SlideTransition(
                            position: Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero)
                                .animate(CurvedAnimation(parent: _slideCtrl, curve: const Interval(0.2, 1.0, curve: Curves.easeOutCubic))),
                            child: FadeTransition(
                              opacity: _slideAnim,
                              child: _UnlockTeaserCard(module: _nextUnlock!, pulse: _pulseCtrl),
                            ),
                          ),
                        ],

                        // Personal best badge
                        if (_isPersonalBest) ...[
                          const SizedBox(height: 12),
                          _PersonalBestBanner(),
                        ],

                        const SizedBox(height: 20),

                        // Section: Feedback recente
                        const _SectionTitle(icon: Icons.auto_awesome, label: 'Feedback do teu Instrutor'),
                        const SizedBox(height: 8),
                        ...(_data?['performance']?['feedbacks'] as List? ?? []).take(2).map((fb) =>
                          Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: _FeedbackCard(fb: fb),
                          ),
                        ),
                        if ((_data?['performance']?['feedbacks'] as List? ?? []).isEmpty)
                          _EmptyCard(
                            icon: Icons.auto_awesome_outlined,
                            message: 'Ainda sem feedback — vai à tua próxima aula!',
                          ),

                        const SizedBox(height: 8),
                        // Financial status
                        if (_data?['balance'] != null)
                          _FinancialStatusCard(balance: _data!['balance']),
                      ]),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildHero(String greeting, String firstName) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1A3A9C), Color(0xFF1A56DB), Color(0xFF2D7DD2)],
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(28),
          bottomRight: Radius.circular(28),
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(greeting, style: const TextStyle(color: Colors.white70, fontSize: 13)),
                        const SizedBox(height: 2),
                        Text(
                          firstName,
                          style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold, letterSpacing: -0.5),
                        ),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: () => context.go('/notifications'),
                    child: Container(
                      width: 42, height: 42,
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
                      child: const Icon(Icons.notifications_outlined, color: Colors.white, size: 22),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Attendance dot bar
              const Text('Últimas 14 aulas', style: TextStyle(color: Colors.white60, fontSize: 11, letterSpacing: 0.5)),
              const SizedBox(height: 8),
              _AttendanceDots(attendance: _data?['performance']?['attendance'] as List? ?? []),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSkeleton() {
    return const Center(child: CircularProgressIndicator(color: Color(0xFF1A56DB)));
  }
}

// ─── Attendance dot bar ───────────────────────────────────────────────────────
class _AttendanceDots extends StatelessWidget {
  final List attendance;
  const _AttendanceDots({required this.attendance});

  @override
  Widget build(BuildContext context) {
    final items = attendance.take(14).toList();
    return Row(
      children: List.generate(14, (i) {
        if (i >= items.length) {
          return Expanded(child: Container(height: 6, margin: const EdgeInsets.symmetric(horizontal: 1.5),
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(3))));
        }
        final status = items[i]['status'] as String? ?? '';
        final color = status == 'PRESENT' ? const Color(0xFF34D399)
            : status == 'LATE' ? const Color(0xFFFBBF24)
            : Colors.white.withOpacity(0.2);
        return Expanded(child: Container(height: 6, margin: const EdgeInsets.symmetric(horizontal: 1.5),
          decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3))));
      }),
    );
  }
}

// ─── Streak card ─────────────────────────────────────────────────────────────
class _StreakCard extends StatelessWidget {
  final int streak;
  final AnimationController pulse;
  const _StreakCard({required this.streak, required this.pulse});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            AnimatedBuilder(
              animation: pulse,
              builder: (_, __) => Transform.scale(
                scale: streak > 0 ? 1.0 + pulse.value * 0.12 : 1.0,
                child: Text(streak > 0 ? '🔥' : '💧', style: const TextStyle(fontSize: 22)),
              ),
            ),
            const SizedBox(width: 6),
            Text('$streak', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Color(0xFF111827))),
          ]),
          const SizedBox(height: 4),
          const Text('dias seguidos', style: TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
          if (streak == 0)
            const Text('Vai à próxima aula!', style: TextStyle(fontSize: 10, color: Color(0xFF1A56DB))),
          if (streak > 0 && streak < 5)
            Text('Mais ${5 - streak} para medalha!', style: const TextStyle(fontSize: 10, color: Color(0xFFF59E0B))),
          if (streak >= 5)
            const Text('Incrível! Continua! ⭐', style: TextStyle(fontSize: 10, color: Color(0xFF10B981))),
        ],
      ),
    );
  }
}

// ─── Weekly goal card ─────────────────────────────────────────────────────────
class _WeeklyGoalCard extends StatelessWidget {
  final int present;
  final int goal;
  const _WeeklyGoalCard({required this.present, required this.goal});

  @override
  Widget build(BuildContext context) {
    final done = present.clamp(0, goal);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Text('🎯', style: TextStyle(fontSize: 22)),
            const Spacer(),
            Text('$done/$goal', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF111827))),
          ]),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: goal > 0 ? done / goal : 0,
              minHeight: 6,
              backgroundColor: const Color(0xFFE5E7EB),
              valueColor: AlwaysStoppedAnimation<Color>(done >= goal ? const Color(0xFF10B981) : const Color(0xFF1A56DB)),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            done >= goal ? 'Meta semanal atingida! 🎉' : 'Meta semanal (${goal - done} em falta)',
            style: TextStyle(fontSize: 10, color: done >= goal ? const Color(0xFF10B981) : const Color(0xFF6B7280)),
          ),
        ],
      ),
    );
  }
}

// ─── Progress ring + stats ────────────────────────────────────────────────────
class _ProgressAndStatsRow extends StatelessWidget {
  final double progress;
  final double avgScore;
  final double attendanceRate;
  const _ProgressAndStatsRow({required this.progress, required this.avgScore, required this.attendanceRate});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Row(children: [
        // Ring
        SizedBox(
          width: 72, height: 72,
          child: Stack(alignment: Alignment.center, children: [
            CircularProgressIndicator(
              value: progress,
              strokeWidth: 6,
              backgroundColor: const Color(0xFFE5E7EB),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF1A56DB)),
              strokeCap: StrokeCap.round,
            ),
            Text('${(progress * 100).round()}%', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF111827))),
          ]),
        ),
        const SizedBox(width: 4),
        const Padding(
          padding: EdgeInsets.only(left: 4),
          child: Text('Módulos\nconcluídos', style: TextStyle(fontSize: 11, color: Color(0xFF6B7280), height: 1.4)),
        ),
        const Spacer(),
        // Stats
        _StatPill(label: 'Nota\nmédia', value: '${avgScore.toStringAsFixed(1)}/10', color: const Color(0xFF1A56DB)),
        const SizedBox(width: 10),
        _StatPill(label: 'Assidui-\ndade', value: '${attendanceRate.round()}%', color: const Color(0xFF10B981)),
      ]),
    );
  }
}

class _StatPill extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _StatPill({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) => Column(children: [
    Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
      child: Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: color)),
    ),
    const SizedBox(height: 4),
    Text(label, style: const TextStyle(fontSize: 10, color: Color(0xFF9CA3AF), height: 1.2), textAlign: TextAlign.center),
  ]);
}

// ─── Next unlock teaser ───────────────────────────────────────────────────────
class _UnlockTeaserCard extends StatelessWidget {
  final Map module;
  final AnimationController pulse;
  const _UnlockTeaserCard({required this.module, required this.pulse});

  @override
  Widget build(BuildContext context) {
    final name = module['module']?['name'] as String? ?? 'Próximo módulo';
    final isInProgress = module['status'] == 'IN_PROGRESS';

    return AnimatedBuilder(
      animation: pulse,
      builder: (_, child) => Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              const Color(0xFF7C3AED).withOpacity(0.85 + pulse.value * 0.1),
              const Color(0xFF4F46E5).withOpacity(0.9),
            ],
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(color: const Color(0xFF7C3AED).withOpacity(0.25 + pulse.value * 0.1), blurRadius: 16, offset: const Offset(0, 6)),
          ],
        ),
        child: child,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.lock_open_rounded, color: Colors.white, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(
                isInProgress ? '🔓 A desbloquear…' : '🔒 Próximo desbloqueio',
                style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 2),
              Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
              if (isInProgress)
                const Text('Continua assim — estás quase!', style: TextStyle(color: Colors.white70, fontSize: 11)),
            ]),
          ),
          const Icon(Icons.chevron_right, color: Colors.white60),
        ]),
      ),
    );
  }
}

// ─── Personal best banner ─────────────────────────────────────────────────────
class _PersonalBestBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    decoration: BoxDecoration(
      gradient: const LinearGradient(colors: [Color(0xFFF59E0B), Color(0xFFEF4444)]),
      borderRadius: BorderRadius.circular(14),
    ),
    child: const Row(children: [
      Text('⭐', style: TextStyle(fontSize: 20)),
      SizedBox(width: 10),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Novo Recorde Pessoal!', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
        Text('A tua melhor nota de sempre nesta sessão 🎉', style: TextStyle(color: Colors.white70, fontSize: 11)),
      ]),
    ]),
  );
}

// ─── Feedback card ────────────────────────────────────────────────────────────
class _FeedbackCard extends StatelessWidget {
  final Map fb;
  const _FeedbackCard({required this.fb});

  @override
  Widget build(BuildContext context) {
    final text = (fb['finalText'] ?? fb['aiGeneratedText'] ?? '') as String;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(6)),
            child: const Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.auto_awesome, size: 12, color: Color(0xFF1A56DB)),
              SizedBox(width: 4),
              Text('IA Mastchieve', style: TextStyle(fontSize: 11, color: Color(0xFF1A56DB), fontWeight: FontWeight.w600)),
            ]),
          ),
          const Spacer(),
          if (fb['status'] == 'SENT')
            const Icon(Icons.check_circle, size: 14, color: Color(0xFF10B981)),
        ]),
        const SizedBox(height: 10),
        Text(
          text.length > 160 ? '${text.substring(0, 160)}…' : text.isEmpty ? 'A gerar feedback…' : text,
          style: const TextStyle(fontSize: 13, color: Color(0xFF374151), height: 1.6),
        ),
      ]),
    );
  }
}

// ─── Financial status ─────────────────────────────────────────────────────────
class _FinancialStatusCard extends StatelessWidget {
  final Map balance;
  const _FinancialStatusCard({required this.balance});

  @override
  Widget build(BuildContext context) {
    final overdue = (balance['overdueCount'] as num?)?.toInt() ?? 0;
    final isOk = overdue == 0;
    return Container(
      margin: const EdgeInsets.only(top: 4),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isOk ? const Color(0xFFF0FDF4) : const Color(0xFFFFF7ED),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isOk ? const Color(0xFFBBF7D0) : const Color(0xFFFED7AA)),
      ),
      child: Row(children: [
        Icon(isOk ? Icons.check_circle_outline : Icons.warning_amber_rounded,
            color: isOk ? const Color(0xFF10B981) : const Color(0xFFF59E0B), size: 20),
        const SizedBox(width: 10),
        Text(
          isOk ? 'Mensalidade em dia ✓' : '$overdue mensalidade(s) em atraso',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500,
              color: isOk ? const Color(0xFF065F46) : const Color(0xFF92400E)),
        ),
      ]),
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
class _SectionTitle extends StatelessWidget {
  final IconData icon;
  final String label;
  const _SectionTitle({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) => Row(children: [
    Icon(icon, size: 16, color: const Color(0xFF6B7280)),
    const SizedBox(width: 6),
    Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF111827))),
  ]);
}

class _EmptyCard extends StatelessWidget {
  final IconData icon;
  final String message;
  const _EmptyCard({required this.icon, required this.message});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14),
      border: Border.all(color: const Color(0xFFE5E7EB))),
    child: Row(children: [
      Icon(icon, color: const Color(0xFF9CA3AF), size: 20),
      const SizedBox(width: 10),
      Expanded(child: Text(message, style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)))),
    ]),
  );
}
