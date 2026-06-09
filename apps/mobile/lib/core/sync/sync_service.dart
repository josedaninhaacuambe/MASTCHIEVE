import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../storage/hive_storage.dart';
import '../network/api_client.dart';

final syncServiceProvider = Provider((ref) => SyncService(ref.read(apiClientProvider)));

class SyncService {
  final ApiClient _api;

  SyncService(this._api);

  /// Listen for connectivity and flush sync queue
  void startListening() {
    Connectivity().onConnectivityChanged.listen((results) {
      final hasConnection = results.any((r) => r != ConnectivityResult.none);
      if (hasConnection) {
        flushQueue();
      }
    });
  }

  Future<void> flushQueue() async {
    final queue = HiveStorage.getSyncQueue();
    if (queue.isEmpty) return;

    for (final item in queue) {
      try {
        final method = item['method'] as String;
        final endpoint = item['endpoint'] as String;
        final body = item['body'] as Map<String, dynamic>?;
        final key = item['key'] as String;

        switch (method) {
          case 'POST':
            await _api.post(endpoint, data: body);
          case 'PUT':
            await _api.put(endpoint, data: body);
          case 'PATCH':
            await _api.patch(endpoint, data: body);
        }

        await HiveStorage.removeSyncItem(key);
      } catch (_) {
        // Keep in queue, retry next time
      }
    }
  }

  Future<void> queueOperation({
    required String method,
    required String endpoint,
    Map<String, dynamic>? body,
  }) async {
    final key = DateTime.now().millisecondsSinceEpoch.toString();
    await HiveStorage.addToSyncQueue({
      'key': key,
      'method': method,
      'endpoint': endpoint,
      'body': body,
      'queuedAt': key,
    });
  }
}
