import 'package:hive_flutter/hive_flutter.dart';

class HiveStorage {
  static late Box<dynamic> _authBox;
  static late Box<dynamic> _cacheBox;
  static late Box<dynamic> _syncQueueBox;

  static Future<void> init() async {
    await Hive.initFlutter();
    _authBox = await Hive.openBox('auth');
    _cacheBox = await Hive.openBox('cache');
    _syncQueueBox = await Hive.openBox('sync_queue');
  }

  // Auth
  static Future<void> saveTokens(String access, String refresh) async {
    await _authBox.put('accessToken', access);
    await _authBox.put('refreshToken', refresh);
  }

  static String? get accessToken => _authBox.get('accessToken');
  static String? get refreshToken => _authBox.get('refreshToken');

  static Future<void> saveUser(Map<String, dynamic> user) async {
    await _authBox.put('user', user);
  }

  static Map<dynamic, dynamic>? get user => _authBox.get('user') as Map?;

  static Future<void> clearAuth() async {
    await _authBox.clear();
  }

  // Cache
  static Future<void> cache(String key, dynamic data, {Duration? ttl}) async {
    await _cacheBox.put(key, {
      'data': data,
      'cachedAt': DateTime.now().millisecondsSinceEpoch,
      'ttl': ttl?.inMilliseconds,
    });
  }

  static dynamic getCache(String key) {
    final entry = _cacheBox.get(key) as Map?;
    if (entry == null) return null;
    final ttl = entry['ttl'] as int?;
    if (ttl != null) {
      final cachedAt = entry['cachedAt'] as int;
      if (DateTime.now().millisecondsSinceEpoch - cachedAt > ttl) {
        _cacheBox.delete(key);
        return null;
      }
    }
    return entry['data'];
  }

  // Offline Sync Queue
  static Future<void> addToSyncQueue(Map<String, dynamic> operation) async {
    final key = DateTime.now().millisecondsSinceEpoch.toString();
    await _syncQueueBox.put(key, operation);
  }

  static List<Map<dynamic, dynamic>> getSyncQueue() {
    return _syncQueueBox.values.map((v) => v as Map<dynamic, dynamic>).toList();
  }

  static Future<void> removeSyncItem(String key) async {
    await _syncQueueBox.delete(key);
  }

  static Future<void> clearSyncQueue() async {
    await _syncQueueBox.clear();
  }
}
