<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import type { WeeklySummaryResponse } from '@daily-english-gym/shared';

const router = useRouter();
const api = useApi();

const summary = ref<WeeklySummaryResponse | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    summary.value = await api.getWeeklySummary();
  } catch (e) {
    error.value = e instanceof Error ? e.message : '週間サマリーの取得に失敗しました';
  } finally {
    isLoading.value = false;
  }
});

function goHome() {
  router.push('/');
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
  });
}
</script>

<template>
  <div class="summary-view">
    <header class="header">
      <button class="back-button" @click="goHome">
        <span class="back-arrow">←</span> 戻る
      </button>
      <h1 class="title">週間サマリー</h1>
    </header>

    <div v-if="isLoading" class="loading-container">
      <LoadingSpinner />
      <p>サマリーを生成中...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button class="retry-button" @click="goHome">ホームに戻る</button>
    </div>

    <div v-else-if="summary" class="summary-content">
      <div class="period-card">
        <h2 class="section-title">今週の期間</h2>
        <p class="period">{{ formatDate(summary.weekStart) }} 〜 {{ formatDate(summary.weekEnd) }}</p>
      </div>

      <div class="stats-card">
        <h2 class="section-title">学習統計</h2>
        <div class="stat-item">
          <span class="stat-label">学習日数</span>
          <span class="stat-value">{{ summary.learningDays }}日</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">トピック数</span>
          <span class="stat-value">{{ summary.topics.length }}件</span>
        </div>
      </div>

      <div v-if="summary.topics.length > 0" class="topics-card">
        <h2 class="section-title">今週のトピック</h2>
        <ul class="topics-list">
          <li v-for="(topic, index) in summary.topics" :key="index" class="topic-item">
            {{ topic }}
          </li>
        </ul>
      </div>

      <div v-if="summary.analysis" class="analysis-card">
        <h2 class="section-title">表現分析</h2>

        <div v-if="summary.analysis.commonExpressions.length > 0" class="analysis-section">
          <h3 class="subsection-title">よく使った表現</h3>
          <div class="expressions">
            <span
              v-for="(expr, index) in summary.analysis.commonExpressions"
              :key="index"
              class="expression-tag"
            >
              {{ expr }}
            </span>
          </div>
        </div>

        <div v-if="summary.analysis.areasForImprovement.length > 0" class="analysis-section">
          <h3 class="subsection-title">改善ポイント</h3>
          <ul class="improvement-list">
            <li
              v-for="(area, index) in summary.analysis.areasForImprovement"
              :key="index"
              class="improvement-item"
            >
              {{ area }}
            </li>
          </ul>
        </div>

        <div v-if="summary.analysis.advice" class="advice-section">
          <h3 class="subsection-title">来週へのアドバイス</h3>
          <p class="advice-text">{{ summary.analysis.advice }}</p>
        </div>
      </div>

      <div v-if="summary.learningDays === 0" class="empty-state">
        <p>今週はまだ学習がありません。</p>
        <button class="start-button" @click="router.push('/input')">学習を始める</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.summary-view {
  padding: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  color: #666;
  transition: all 0.2s;
}

.back-button:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
  color: #666;
}

.error-container {
  text-align: center;
  padding: 2rem;
}

.error-message {
  color: #e53935;
  margin-bottom: 1rem;
}

.retry-button {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.period-card,
.stats-card,
.topics-card,
.analysis-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.period {
  font-size: 1.125rem;
  color: #666;
  margin: 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: #666;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #667eea;
}

.topics-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.topic-item {
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
}

.topic-item:last-child {
  border-bottom: none;
}

.subsection-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
  margin: 0 0 0.75rem;
}

.analysis-section {
  margin-bottom: 1.5rem;
}

.analysis-section:last-child {
  margin-bottom: 0;
}

.expressions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.expression-tag {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.improvement-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.improvement-item {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
  color: #555;
}

.improvement-item::before {
  content: '•';
  position: absolute;
  left: 0.5rem;
  color: #ffa726;
}

.advice-section {
  background: #f8f9ff;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.advice-text {
  margin: 0;
  color: #555;
  line-height: 1.6;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  background: #f9f9f9;
  border-radius: 12px;
}

.empty-state p {
  color: #666;
  margin-bottom: 1rem;
}

.start-button {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
}

.start-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
</style>
