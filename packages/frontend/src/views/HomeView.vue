<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';
import { useApi } from '@/composables/useApi';

const router = useRouter();
const sessionStore = useSessionStore();
const api = useApi();

const streakDays = ref<number>(0);
const isLoadingStreak = ref(true);

onMounted(async () => {
  try {
    const result = await api.getStreak();
    streakDays.value = result.streakDays;
  } catch (e) {
    console.error('Failed to load streak:', e);
  } finally {
    isLoadingStreak.value = false;
  }
});

function startLearning() {
  sessionStore.resetSession();
  router.push('/input');
}

function goToHistory() {
  router.push('/history');
}

function goToSummary() {
  router.push('/summary');
}
</script>

<template>
  <div class="home-view">
    <div class="hero">
      <h2 class="hero-title">Today's English Gym</h2>
      <p class="hero-description">
        AIニュースを使って、毎日10分の英語スピーキング練習を始めましょう。
      </p>
    </div>

    <div v-if="!isLoadingStreak && streakDays > 0" class="streak-section">
      <div class="streak-badge">
        <span class="streak-icon">🔥</span>
        <span class="streak-count">{{ streakDays }}</span>
        <span class="streak-label">日連続</span>
      </div>
    </div>

    <div class="action-section">
      <button class="start-button" @click="startLearning">今日の学習を始める</button>
      <div class="secondary-buttons">
        <button class="history-button" @click="goToHistory">履歴を見る</button>
        <button class="summary-button" @click="goToSummary">週間サマリー</button>
      </div>
    </div>

    <div class="features">
      <div class="feature">
        <div class="feature-icon">1</div>
        <div class="feature-content">
          <h3>Input</h3>
          <p>AIニュースを入力</p>
        </div>
      </div>
      <div class="feature">
        <div class="feature-icon">2</div>
        <div class="feature-content">
          <h3>Understand</h3>
          <p>3レベルで理解</p>
        </div>
      </div>
      <div class="feature">
        <div class="feature-icon">3</div>
        <div class="feature-content">
          <h3>Speak</h3>
          <p>質問に答えて録音</p>
        </div>
      </div>
      <div class="feature">
        <div class="feature-icon">4</div>
        <div class="feature-content">
          <h3>Reflect</h3>
          <p>AIフィードバック</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 2rem;
}

.hero {
  text-align: center;
  margin-bottom: 3rem;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 1rem;
}

.hero-description {
  font-size: 1.125rem;
  color: #666;
  max-width: 500px;
}

.streak-section {
  margin-bottom: 1.5rem;
}

.streak-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%);
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.streak-icon {
  font-size: 1.5rem;
}

.streak-count {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
}

.streak-label {
  font-size: 1rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.action-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 3rem;
}

.start-button {
  padding: 1rem 2.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.start-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.start-button:active {
  transform: translateY(0);
}

.secondary-buttons {
  display: flex;
  gap: 1rem;
}

.history-button,
.summary-button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 50px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.history-button:hover,
.summary-button:hover {
  background-color: #667eea;
  color: white;
}

.features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  width: 100%;
  max-width: 500px;
}

.feature {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.feature-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
}

.feature-content h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.feature-content p {
  font-size: 0.875rem;
  color: #666;
  margin: 0.25rem 0 0;
}

@media (max-width: 600px) {
  .features {
    grid-template-columns: 1fr;
  }

  .hero-title {
    font-size: 2rem;
  }
}
</style>
