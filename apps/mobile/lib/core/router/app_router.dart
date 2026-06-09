import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/dashboard/presentation/dashboard_screen.dart';
import '../../features/performance/presentation/performance_screen.dart';
import '../../features/training/presentation/training_plan_screen.dart';
import '../../features/financial/presentation/financial_screen.dart';
import '../../features/notifications/presentation/notifications_screen.dart';
import '../storage/hive_storage.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: HiveStorage.accessToken != null ? '/dashboard' : '/login',
    redirect: (context, state) {
      final isLoggedIn = HiveStorage.accessToken != null;
      final isOnAuthPage = state.matchedLocation == '/login';
      if (!isLoggedIn && !isOnAuthPage) return '/login';
      if (isLoggedIn && isOnAuthPage) return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(path: '/dashboard', builder: (_, __) => const DashboardScreen()),
          GoRoute(path: '/performance', builder: (_, __) => const PerformanceScreen()),
          GoRoute(path: '/training', builder: (_, __) => const TrainingPlanScreen()),
          GoRoute(path: '/financial', builder: (_, __) => const FinancialScreen()),
          GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
        ],
      ),
    ],
  );
});

// Shell with bottom nav
import 'package:flutter/material.dart';

class MainShell extends StatelessWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final index = _indexFromLocation(location);

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) {
          final routes = ['/dashboard', '/performance', '/training', '/financial', '/notifications'];
          context.go(routes[i]);
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Início'),
          NavigationDestination(icon: Icon(Icons.bar_chart_outlined), selectedIcon: Icon(Icons.bar_chart), label: 'Desempenho'),
          NavigationDestination(icon: Icon(Icons.fitness_center_outlined), selectedIcon: Icon(Icons.fitness_center), label: 'Treino'),
          NavigationDestination(icon: Icon(Icons.credit_card_outlined), selectedIcon: Icon(Icons.credit_card), label: 'Pagamentos'),
          NavigationDestination(icon: Icon(Icons.notifications_outlined), selectedIcon: Icon(Icons.notifications), label: 'Avisos'),
        ],
      ),
    );
  }

  int _indexFromLocation(String loc) {
    if (loc.startsWith('/performance')) return 1;
    if (loc.startsWith('/training')) return 2;
    if (loc.startsWith('/financial')) return 3;
    if (loc.startsWith('/notifications')) return 4;
    return 0;
  }
}
