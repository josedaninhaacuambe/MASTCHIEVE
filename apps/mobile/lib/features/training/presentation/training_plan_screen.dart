import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/hive_storage.dart';

class TrainingPlanScreen extends ConsumerStatefulWidget {
  const TrainingPlanScreen({super.key});

  @override
  ConsumerState<TrainingPlanScreen> createState() => _TrainingPlanScreenState();
}

class _TrainingPlanScreenState extends ConsumerState<TrainingPlanScreen> {
  List<dynamic> _plans = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final cached = HiveStorage.getCache('training_plans');
    if (cached != null) {
      setState(() { _plans = List.from(cached); _loading = false; });
    }

    try {
      final api = ref.read(apiClientProvider);
      final user = HiveStorage.user;
      final studentId = user?['profile']?['id'];
      if (studentId == null) return;

      final resp = await api.get('/students/$studentId/performance');
      final data = List.from(resp.data['data']?['trainingPlans'] ?? []);

      await HiveStorage.cache('training_plans', data, ttl: const Duration(hours: 6));
      if (mounted) setState(() { _plans = data; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(title: const Text('Plano de Treino')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _plans.isEmpty
              ? _buildEmpty()
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _plans.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (_, i) => _PlanCard(plan: _plans[i]),
                  ),
                ),
    );
  }

  Widget _buildEmpty() => Center(
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.fitness_center, size: 64, color: Colors.grey.shade300),
        const SizedBox(height: 16),
        const Text('Nenhum plano de treino', style: TextStyle(color: Color(0xFF6B7280))),
        const Text('O teu instrutor irá criar um brevemente.', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 13)),
      ],
    ),
  );
}

class _PlanCard extends StatefulWidget {
  final Map plan;
  const _PlanCard({required this.plan});

  @override
  State<_PlanCard> createState() => _PlanCardState();
}

class _PlanCardState extends State<_PlanCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final exercises = (widget.plan['exercises'] as List?) ?? [];
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(10)),
                    child: const Icon(Icons.fitness_center, color: Color(0xFF1A56DB), size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(widget.plan['title'] ?? 'Plano de Treino',
                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                            ),
                            if (widget.plan['aiGenerated'] == true)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(4)),
                                child: const Text('IA', style: TextStyle(fontSize: 10, color: Color(0xFF1A56DB), fontWeight: FontWeight.bold)),
                              ),
                          ],
                        ),
                        Text('${exercises.length} exercícios', style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
                      ],
                    ),
                  ),
                  Icon(_expanded ? Icons.expand_less : Icons.expand_more, color: const Color(0xFF9CA3AF)),
                ],
              ),
            ),
          ),
          if (_expanded) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (widget.plan['description'] != null) ...[
                    Text(widget.plan['description'], style: const TextStyle(fontSize: 13, color: Color(0xFF374151))),
                    const SizedBox(height: 12),
                  ],
                  if ((widget.plan['objectives'] as List?)?.isNotEmpty == true) ...[
                    const Text('Objetivos', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                    const SizedBox(height: 6),
                    ...(widget.plan['objectives'] as List).map((o) => Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(
                        children: [
                          const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 14),
                          const SizedBox(width: 8),
                          Expanded(child: Text(o.toString(), style: const TextStyle(fontSize: 13))),
                        ],
                      ),
                    )),
                    const SizedBox(height: 12),
                  ],
                  const Text('Exercícios', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 8),
                  ...exercises.asMap().entries.map((e) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: const Color(0xFFF9FAFB), borderRadius: BorderRadius.circular(8)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${e.key + 1}. ${e.value['name'] ?? ''}',
                              style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
                          if (e.value['description'] != null)
                            Text(e.value['description'], style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
                          const SizedBox(height: 4),
                          Wrap(
                            spacing: 8,
                            children: [
                              if (e.value['duration'] != null)
                                _Tag('⏱ ${e.value['duration']}'),
                              if (e.value['sets'] != null)
                                _Tag('${e.value['sets']} séries'),
                              if (e.value['reps'] != null)
                                _Tag('${e.value['reps']} reps'),
                            ],
                          ),
                        ],
                      ),
                    ),
                  )),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  final String text;
  const _Tag(this.text);

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(color: Colors.white, border: Border.all(color: const Color(0xFFE5E7EB)), borderRadius: BorderRadius.circular(4)),
    child: Text(text, style: const TextStyle(fontSize: 11, color: Color(0xFF374151))),
  );
}
