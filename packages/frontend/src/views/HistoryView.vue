<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import type { LogSummary, LogDetailResponse } from '@daily-english-gym/shared';

const router = useRouter();
const api = useApi();

const isLoadingList = ref(false);
const isLoadingDetail = ref(false);
const errorMessage = ref<string | null>(null);

// 現在の年月
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth() + 1);

// ログ一覧
const logs = ref<LogSummary[]>([]);

// 選択中のログ詳細
const selectedDate = ref<string | null>(null);
const logDetail = ref<LogDetailResponse | null>(null);

// 音声再生用URL
const recordingUrls = ref<Map<number, string>>(new Map());
const ttsUrls = ref<Map<number, string>>(new Map());

// アコーディオン開閉状態（セッションインデックス-セクション名のキーで管理）
const expandedSections = ref<Set<string>>(new Set());

// 年の選択肢
const years = computed(() => {
  const current = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => current - i);
});

// 月の選択肢
const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

onMounted(() => {
  loadLogs();
});

watch([currentYear, currentMonth], () => {
  selectedDate.value = null;
  logDetail.value = null;
  loadLogs();
});

async function loadLogs() {
  isLoadingList.value = true;
  errorMessage.value = null;
  try {
    const response = await api.getLogList(currentYear.value, currentMonth.value);
    logs.value = response.logs;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'ログの取得に失敗しました';
  } finally {
    isLoadingList.value = false;
  }
}

async function selectLog(date: string) {
  if (selectedDate.value === date) {
    // 同じ日付をクリックしたら閉じる
    selectedDate.value = null;
    logDetail.value = null;
    cleanupUrls();
    return;
  }

  selectedDate.value = date;
  isLoadingDetail.value = true;
  cleanupUrls();

  try {
    logDetail.value = await api.getLogDetail(date);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'ログ詳細の取得に失敗しました';
  } finally {
    isLoadingDetail.value = false;
  }
}

async function playRecording(sessionNumber: number) {
  if (!selectedDate.value) return;

  try {
    const blob = await api.getAudioFile(selectedDate.value, sessionNumber);
    const url = URL.createObjectURL(blob);
    recordingUrls.value.set(sessionNumber, url);

    // 少し待ってから再生
    setTimeout(() => {
      const audio = document.getElementById(`recording-${sessionNumber}`) as HTMLAudioElement;
      if (audio) audio.play();
    }, 100);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '録音の取得に失敗しました';
  }
}

async function playTts(sessionNumber: number) {
  if (!selectedDate.value) return;

  try {
    const blob = await api.getTtsAudioFile(selectedDate.value, sessionNumber);
    const url = URL.createObjectURL(blob);
    ttsUrls.value.set(sessionNumber, url);

    // 少し待ってから再生
    setTimeout(() => {
      const audio = document.getElementById(`tts-${sessionNumber}`) as HTMLAudioElement;
      if (audio) audio.play();
    }, 100);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'TTS音声の取得に失敗しました';
  }
}

function cleanupUrls() {
  recordingUrls.value.forEach((url) => URL.revokeObjectURL(url));
  ttsUrls.value.forEach((url) => URL.revokeObjectURL(url));
  recordingUrls.value.clear();
  ttsUrls.value.clear();
}

function toggleSection(sessionIndex: number, section: string) {
  const key = `${sessionIndex}-${section}`;
  if (expandedSections.value.has(key)) {
    expandedSections.value.delete(key);
  } else {
    expandedSections.value.add(key);
  }
}

function isSectionExpanded(sessionIndex: number, section: string): boolean {
  return expandedSections.value.has(`${sessionIndex}-${section}`);
}

function goBack() {
  cleanupUrls();
  router.push('/');
}

function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

// Markdownの各セクションをパースして表示
function parseMarkdownSections(content: string) {
  const sessions: Array<{
    title: string;
    time: string;
    newsContent: string;
    level1Text: string;
    level2Text: string;
    speakingQuestion: string;
    yourResponse: string;
    corrected: string;
    upgraded: string;
    comment: string;
  }> = [];

  const sessionMatches = content.split(/(?=## Session \d+)/g).filter((s) => s.trim());

  for (const sessionBlock of sessionMatches) {
    if (!sessionBlock.startsWith('## Session')) continue;

    const titleMatch = sessionBlock.match(/### (.+)/);
    const timeMatch = sessionBlock.match(/## Session \d+ \((\d+:\d+)\)/);

    const extractSection = (name: string): string => {
      const regex = new RegExp(`#### ${name}\\n\\n([\\s\\S]*?)(?=####|---|$)`);
      const match = sessionBlock.match(regex);
      return match ? match[1].trim() : '';
    };

    sessions.push({
      title: titleMatch ? titleMatch[1] : 'Untitled',
      time: timeMatch ? timeMatch[1] : '',
      newsContent: extractSection('News Content \\(Original\\)'),
      level1Text: extractSection('Level 1 \\(Easy\\)'),
      level2Text: extractSection('Level 2 \\(Speaking\\)'),
      speakingQuestion: extractSection('Speaking Question'),
      yourResponse: extractSection('Your Response'),
      corrected: extractSection('Corrected'),
      upgraded: extractSection('Upgraded'),
      comment: extractSection('Comment'),
    });
  }

  return sessions;
}
</script>

<template>
  <div class="history-view">
    <div class="header">
      <button class="back-button" @click="goBack">&larr; ホームへ</button>
      <h2>学習履歴</h2>
    </div>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div class="month-selector">
      <select v-model="currentYear" class="year-select">
        <option v-for="year in years" :key="year" :value="year">{{ year }}年</option>
      </select>
      <select v-model="currentMonth" class="month-select">
        <option v-for="month in months" :key="month" :value="month">{{ month }}月</option>
      </select>
    </div>

    <div v-if="isLoadingList" class="loading-container">
      <LoadingSpinner message="ログを読み込み中..." />
    </div>

    <div v-else-if="logs.length === 0" class="empty-state">
      <p>この月の学習記録はありません</p>
    </div>

    <div v-else class="log-list">
      <div
        v-for="log in logs"
        :key="log.date"
        class="log-item"
        :class="{ expanded: selectedDate === log.date }"
      >
        <div class="log-header" @click="selectLog(log.date)">
          <div class="log-date">
            <span class="date-text">{{ formatDate(log.date) }}</span>
            <span class="session-count">({{ log.sessionCount }}セッション)</span>
          </div>
          <div class="log-indicators">
            <span v-if="log.hasAudio" class="audio-indicator" title="音声あり">🎤</span>
            <span class="expand-icon">{{ selectedDate === log.date ? '▼' : '▶' }}</span>
          </div>
        </div>

        <div v-if="selectedDate === log.date" class="log-detail">
          <div v-if="isLoadingDetail" class="loading-container">
            <LoadingSpinner message="詳細を読み込み中..." />
          </div>

          <template v-else-if="logDetail">
            <div
              v-for="(session, index) in parseMarkdownSections(logDetail.content)"
              :key="index"
              class="session-block"
            >
              <h3 class="session-title">
                Session {{ index + 1 }}
                <span v-if="session.time" class="session-time">({{ session.time }})</span>
              </h3>

              <div class="section-card">
                <h4>{{ session.title }}</h4>
              </div>

              <div class="section-card news-content accordion">
                <div class="accordion-header" @click="toggleSection(index, 'original')">
                  <h4>News Content (Original)</h4>
                  <span class="accordion-icon">{{ isSectionExpanded(index, 'original') ? '▼' : '▶' }}</span>
                </div>
                <div v-if="isSectionExpanded(index, 'original')" class="accordion-content">
                  <p>{{ session.newsContent }}</p>
                </div>
              </div>

              <div v-if="session.level1Text" class="section-card level1-content accordion">
                <div class="accordion-header" @click="toggleSection(index, 'level1')">
                  <h4>Level 1 (Easy)</h4>
                  <span class="accordion-icon">{{ isSectionExpanded(index, 'level1') ? '▼' : '▶' }}</span>
                </div>
                <div v-if="isSectionExpanded(index, 'level1')" class="accordion-content">
                  <p>{{ session.level1Text }}</p>
                </div>
              </div>

              <div v-if="session.level2Text" class="section-card level2-content accordion">
                <div class="accordion-header" @click="toggleSection(index, 'level2')">
                  <h4>Level 2 (Speaking)</h4>
                  <span class="accordion-icon">{{ isSectionExpanded(index, 'level2') ? '▼' : '▶' }}</span>
                </div>
                <div v-if="isSectionExpanded(index, 'level2')" class="accordion-content">
                  <p>{{ session.level2Text }}</p>
                </div>
              </div>

              <div class="section-card">
                <h4>Speaking Question</h4>
                <p>{{ session.speakingQuestion }}</p>
              </div>

              <div class="section-card">
                <h4>Your Response</h4>
                <p>{{ session.yourResponse }}</p>
              </div>

              <div class="section-card">
                <h4>Corrected</h4>
                <p>{{ session.corrected }}</p>
              </div>

              <div class="section-card">
                <h4>Upgraded</h4>
                <p class="upgraded-text">{{ session.upgraded }}</p>
              </div>

              <div class="section-card comment-card">
                <h4>Comment</h4>
                <p>{{ session.comment }}</p>
              </div>

              <div
                v-if="logDetail.sessions[index]"
                class="audio-controls"
              >
                <template v-if="logDetail.sessions[index].hasRecording">
                  <button
                    v-if="!recordingUrls.get(index + 1)"
                    class="audio-button"
                    @click="playRecording(index + 1)"
                  >
                    🎤 録音を再生
                  </button>
                  <audio
                    v-else
                    :id="`recording-${index + 1}`"
                    :src="recordingUrls.get(index + 1)"
                    controls
                    class="audio-player"
                  />
                </template>

                <template v-if="logDetail.sessions[index].hasTts">
                  <button
                    v-if="!ttsUrls.get(index + 1)"
                    class="audio-button"
                    @click="playTts(index + 1)"
                  >
                    🔊 TTS再生
                  </button>
                  <audio
                    v-else
                    :id="`tts-${index + 1}`"
                    :src="ttsUrls.get(index + 1)"
                    controls
                    class="audio-player"
                  />
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-view {
  max-width: 700px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.back-button {
  background: none;
  border: none;
  color: #667eea;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
}

.back-button:hover {
  text-decoration: underline;
}

.error-message {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.month-selector {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.year-select,
.month-select {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.log-item {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.log-item.expanded {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.log-header:hover {
  background-color: #f9fafb;
}

.log-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-text {
  font-weight: 500;
}

.session-count {
  color: #666;
  font-size: 0.875rem;
}

.log-indicators {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.audio-indicator {
  font-size: 1rem;
}

.expand-icon {
  color: #999;
  font-size: 0.75rem;
}

.log-detail {
  border-top: 1px solid #eee;
  padding: 1rem;
  background-color: #fafafa;
}

.session-block {
  margin-bottom: 2rem;
}

.session-block:last-child {
  margin-bottom: 0;
}

.session-title {
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
  margin: 0 0 1rem;
}

.session-time {
  font-weight: 400;
  color: #999;
}

.section-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.section-card h4 {
  font-size: 0.75rem;
  font-weight: 600;
  color: #667eea;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-card p {
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
}

/* アコーディオンスタイル */
.accordion .accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.accordion .accordion-header:hover {
  opacity: 0.8;
}

.accordion-icon {
  font-size: 0.75rem;
  color: #999;
}

.accordion-content {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.section-card:not(.accordion) h4 {
  margin-bottom: 0.5rem;
}

.news-content {
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
}

.level1-content {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.level2-content {
  background-color: #fefce8;
  border: 1px solid #fde68a;
}

.upgraded-text {
  font-weight: 500;
}

.comment-card {
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border: 1px solid #ddd6fe;
}

.comment-card p {
  color: #5b21b6;
}

.audio-controls {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.audio-button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.audio-button:hover {
  background-color: #5a67d8;
}

.audio-player {
  width: 100%;
  max-width: 250px;
  height: 40px;
}
</style>
