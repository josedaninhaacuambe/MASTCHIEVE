import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  List<dynamic> _notifications = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final api = ref.read(apiClientProvider);
      final resp = await api.get('/notifications');
      if (mounted) setState(() {
        _notifications = List.from(resp.data['data']['data'] ?? []);
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Notificações'),
        actions: [
          TextButton(
            onPressed: () async {
              await ref.read(apiClientProvider).patch('/notifications/read-all');
              _load();
            },
            child: const Text('Marcar tudo lido'),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? const Center(child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.notifications_none, size: 64, color: Color(0xFFD1D5DB)),
                    SizedBox(height: 12),
                    Text('Sem notificações', style: TextStyle(color: Color(0xFF9CA3AF))),
                  ],
                ))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _notifications.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) => _NotifCard(notif: _notifications[i]),
                ),
    );
  }
}

class _NotifCard extends StatelessWidget {
  final Map notif;
  const _NotifCard({required this.notif});

  @override
  Widget build(BuildContext context) {
    final isRead = notif['readAt'] != null;
    final typeColors = {
      'INFO': const Color(0xFF1A56DB),
      'WARNING': const Color(0xFFF59E0B),
      'SUCCESS': const Color(0xFF10B981),
      'PAYMENT_DUE': const Color(0xFFEF4444),
      'FEEDBACK_READY': const Color(0xFF8B5CF6),
    };
    final color = typeColors[notif['type']] ?? const Color(0xFF6B7280);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isRead ? Colors.white : color.withOpacity(0.04),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: isRead ? const Color(0xFFE5E7EB) : color.withOpacity(0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 8, height: 8, margin: const EdgeInsets.only(top: 4),
            decoration: BoxDecoration(
              color: isRead ? Colors.transparent : color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(notif['title'] ?? '', style: TextStyle(fontWeight: isRead ? FontWeight.w500 : FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 2),
                Text(notif['body'] ?? '', style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
