import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/hive_storage.dart';

class FinancialScreen extends ConsumerStatefulWidget {
  const FinancialScreen({super.key});

  @override
  ConsumerState<FinancialScreen> createState() => _FinancialScreenState();
}

class _FinancialScreenState extends ConsumerState<FinancialScreen> {
  Map<String, dynamic>? _balance;
  List<dynamic> _payments = [];
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

      final [balance, payments] = await Future.wait([
        api.get('/financial/students/$studentId/balance'),
        api.get('/financial/payments', params: {'studentId': studentId, 'limit': '12'}),
      ]);

      final balanceData = Map<String, dynamic>.from(balance.data['data']);
      final paymentsList = List.from(payments.data['data']['data']);

      await HiveStorage.cache('financial_$studentId', {'balance': balanceData, 'payments': paymentsList}, ttl: const Duration(hours: 2));

      if (mounted) setState(() { _balance = balanceData; _payments = paymentsList; _loading = false; });
    } catch (_) {
      final user = HiveStorage.user;
      final cached = HiveStorage.getCache('financial_${user?['profile']?['id']}');
      if (cached != null && mounted) {
        setState(() {
          _balance = Map<String, dynamic>.from(cached['balance']);
          _payments = List.from(cached['payments']);
          _loading = false;
        });
      } else if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(title: const Text('Pagamentos')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Balance Summary
                  if (_balance != null) ...[
                    _BalanceCard(balance: _balance!),
                    const SizedBox(height: 20),
                  ],
                  const Text('Histórico', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  ..._payments.map((p) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _PaymentCard(payment: p),
                  )),
                  if (_payments.isEmpty)
                    const Center(child: Padding(
                      padding: EdgeInsets.all(32),
                      child: Text('Sem pagamentos', style: TextStyle(color: Color(0xFF9CA3AF))),
                    )),
                ],
              ),
            ),
    );
  }
}

class _BalanceCard extends StatelessWidget {
  final Map balance;
  const _BalanceCard({required this.balance});

  @override
  Widget build(BuildContext context) {
    final overdue = (balance['overdueCount'] as int? ?? 0) > 0;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: overdue
              ? [const Color(0xFFEF4444), const Color(0xFFDC2626)]
              : [const Color(0xFF1A56DB), const Color(0xFF1A3378)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Estado da Conta', style: TextStyle(color: Colors.white70, fontSize: 13)),
          const SizedBox(height: 4),
          Text(
            overdue ? '${balance['overdueCount']} mensalidade(s) em atraso' : 'Conta em dia',
            style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _Stat('Pago', '€${(balance['paidAmount'] as num?)?.toStringAsFixed(2) ?? '0.00'}')),
              Expanded(child: _Stat('Pendente', '€${(balance['pendingAmount'] as num?)?.toStringAsFixed(2) ?? '0.00'}')),
              Expanded(child: _Stat('Em Atraso', '€${(balance['overdueAmount'] as num?)?.toStringAsFixed(2) ?? '0.00'}')),
            ],
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String label;
  final String value;
  const _Stat(this.label, this.value);

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label, style: const TextStyle(color: Colors.white60, fontSize: 11)),
      Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
    ],
  );
}

class _PaymentCard extends StatelessWidget {
  final Map payment;
  const _PaymentCard({required this.payment});

  @override
  Widget build(BuildContext context) {
    final status = payment['status'] as String? ?? '';
    final configs = {
      'PAID': (const Color(0xFF10B981), 'Pago', Icons.check_circle),
      'PENDING': (const Color(0xFFF59E0B), 'Pendente', Icons.access_time),
      'OVERDUE': (const Color(0xFFEF4444), 'Em atraso', Icons.warning),
    };
    final cfg = configs[status] ?? (const Color(0xFF9CA3AF), status, Icons.help);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        children: [
          Icon(cfg.$3, color: cfg.$1, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(payment['receiptNumber'] ?? 'Mensalidade', style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
                Text(_formatDate(payment['dueDate']), style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('€${(payment['amount'] as num?)?.toStringAsFixed(2) ?? '—'}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              Text(cfg.$2, style: TextStyle(fontSize: 11, color: cfg.$1, fontWeight: FontWeight.w500)),
            ],
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
