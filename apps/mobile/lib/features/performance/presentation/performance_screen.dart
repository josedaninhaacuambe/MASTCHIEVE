import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/hive_storage.dart';

class PerformanceScreen extends ConsumerStatefulWidget {
  const PerformanceScreen({super.key});

  @override
  ConsumerState<PerformanceScreen> createState() => _PerformanceScreenState();
}

class _PerformanceScreenState extends ConsumerState<PerformanceScreen> {
  List<dynamic> _records = [];
  List<dynamic> _progress = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final api = ref.read(apiClientProvider);
      final user = HiveStorage.user;
      final studentId = user?['profile']?['id'];
      if (studentId == null) return;

      final [perf, trend] = await Future.wait([
        api.get('/students/$studentId/performance'),
        api.get('/kpi/students/$studentId/trend'),
      ]);

      final data = perf.data['data'];
      await HiveStorage.cache('performance_$studentId', data, ttl: const Duration(hours: 2));

      if (mounted) {
        setState(() {
          _records = List.from(data['records'] ?? []);
          _progress = List.from(data['progress'] ?? []);
          _loading = false;
        });
      }
    } catch (_) {
      final user = HiveStorage.user;
      final cached = HiveStorage.getCache('performance_${user?['profile']?['id']}');
      if (cached != null && mounted) {
        setState(() {
          _records = List.from(cached['records'] ?? []);
          _progress = List.from(cached['progress'] ?? []);
          _loading = false;
        });
      } else if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(title: const Text('Desempenho')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Progress Chart
                  if (_records.isNotEmpty) ...[
                    _buildChart(),
                    const SizedBox(height: 20),
                  ],

                  // Modules Progress
                  const Text('Módulos de Natação', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  ..._progress.map((p) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _ModuleCard(module: p),
                  )),

                  // Recent Records
                  const SizedBox(height: 8),
                  const Text('Avaliações Recentes', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  ..._records.take(5).map((r) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _RecordCard(record: r),
                  )),
                ],
              ),
            ),
    );
  }

  Widget _buildChart() {
    final spots = _records.asMap().entries.map((e) {
      return FlSpot(e.key.toDouble(), (e.value['overallScore'] as num?)?.toDouble() ?? 0);
    }).toList();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE5E7EB))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Evolução de Desempenho', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
          const SizedBox(height: 16),
          SizedBox(
            height: 160,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(show: true, drawVerticalLine: false, horizontalInterval: 2),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 30, interval: 2)),
                  bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                borderData: FlBorderData(show: false),
                minY: 0, maxY: 10,
                lineBarsData: [
                  LineChartBarData(
                    spots: spots,
                    isCurved: true,
                    color: const Color(0xFF1A56DB),
                    barWidth: 2.5,
                    dotData: FlDotData(show: false),
                    belowBarData: BarAreaData(show: true, color: const Color(0xFF1A56DB).withOpacity(0.1)),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ModuleCard extends StatelessWidget {
  final Map module;
  const _ModuleCard({required this.module});

  @override
  Widget build(BuildContext context) {
    final status = module['status'] as String? ?? 'NOT_STARTED';
    final colors = {
      'COMPLETED': const Color(0xFF10B981),
      'IN_PROGRESS': const Color(0xFF1A56DB),
      'NOT_STARTED': const Color(0xFF9CA3AF),
      'NEEDS_REVIEW': const Color(0xFFF59E0B),
    };
    final labels = {
      'COMPLETED': 'Concluído', 'IN_PROGRESS': 'Em Progresso',
      'NOT_STARTED': 'Não Iniciado', 'NEEDS_REVIEW': 'Rever',
    };
    final color = colors[status] ?? const Color(0xFF9CA3AF);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFE5E7EB))),
      child: Row(
        children: [
          Container(width: 4, height: 40, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(module['module']?['name'] ?? '—', style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
                Text(labels[status] ?? status, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
          if (module['score'] != null)
            Text('${module['score']}/10', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        ],
      ),
    );
  }
}

class _RecordCard extends StatelessWidget {
  final Map record;
  const _RecordCard({required this.record});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFE5E7EB))),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _formatDate(record['recordedAt']),
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
              ),
              if (record['instructorNotes'] != null)
                Text(
                  record['instructorNotes'].toString().length > 50
                      ? '${record['instructorNotes'].toString().substring(0, 50)}...'
                      : record['instructorNotes'].toString(),
                  style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                ),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(20)),
            child: Text(
              '${record['overallScore']?.toStringAsFixed(1) ?? '—'}/10',
              style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1A56DB), fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String? d) {
    if (d == null) return '—';
    final date = DateTime.tryParse(d);
    if (date == null) return d;
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }
}
