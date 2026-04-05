<script setup lang="ts">
import dayjs from "dayjs";
import es from "dayjs/locale/es";
dayjs.locale(es);

const tasks = computed(() => useTaskStore().tasks);

onMounted(async () => {
  if (tasks.value.length === 0) {
    await useTaskStore().fetchTasks();
  }
});

const priorityChartData = computed(() => {
  const counts = { Alta: 0, Media: 0, Baja: 0 };
  tasks.value.forEach((t) => counts[t.prioridad]++);
  return [
    { name: "Alta", total: counts.Alta },
    { name: "Media", total: counts.Media },
    { name: "Baja", total: counts.Baja },
  ];
});

const statusChartData = computed(() => {
  const statusCounts = { Pendiente: 0, Completada: 0 };
  tasks.value.forEach((t) => statusCounts[t.estado]++);
  return [
    { name: "Pendiente", total: statusCounts.Pendiente },
    { name: "Completada", total: statusCounts.Completada },
  ];
});

const topCreatedDays = computed(() => {
  const map = {};
  tasks.value.forEach((t) => {
    const day = dayjs(t.createdAt).format("dddd");
    map[day] = (map[day] || 0) + 1;
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
});

const topCompletedDays = computed(() => {
  const map = {};
  tasks.value
    .filter((t) => t.estado === "Completada")
    .forEach((t) => {
      const day = dayjs(t.updatedAt || t.createdAt).format("dddd");
      map[day] = (map[day] || 0) + 1;
    });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
});
</script>

<template>
  <GPageContainer>
    <div class="p-6 space-y-8 bg-black min-h-screen text-white">
      <h1 class="text-2xl font-bold mb-6">Panel de Estadísticas</h1>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card class="bg-zinc-900 border-zinc-800 p-6">
          <CardHeader>
            <CardTitle class="text-zinc-400 text-sm"
              >Distribución por Prioridad</CardTitle
            >
          </CardHeader>
          <div class="h-[300px] w-full">
            <BarChart
              class="h-full"
              :data="priorityChartData"
              index="name"
              :categories="['total']"
              :colors="['#ef4444', '#eab308', '#3b82f6']"
              :margin="{ top: 10, right: 10, bottom: 20, left: 10 }"
            />
          </div>
        </Card>

        <Card class="bg-zinc-900 border-zinc-800 p-6">
          <CardHeader>
            <CardTitle class="text-zinc-400 text-sm"
              >Tareas por Estado</CardTitle
            >
          </CardHeader>
          <div class="h-[300px] w-full">
            <BarChart
              class="h-full"
              v-if="statusChartData && statusChartData.length > 0"
              :data="statusChartData"
              index="name"
              :categories="['total']"
              :colors="['#22c55e']"
              :margin="{ top: 10, right: 10, bottom: 20, left: 10 }"
            />
          </div>
        </Card>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3
            class="text-blue-400 text-xs font-bold uppercase tracking-tighter mb-4 flex items-center"
          >
            <Plus class="w-4 h-4 mr-2" /> Top 3 Días con más Creaciones
          </h3>
          <div class="space-y-3">
            <div
              v-for="([day, count], i) in topCreatedDays"
              :key="day"
              class="flex justify-between items-center p-3 bg-zinc-950 rounded-lg border border-zinc-800"
            >
              <span class="text-sm font-medium">{{ i + 1 }}. {{ day }}</span>
              <span
                class="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded"
                >{{ count }} tareas</span
              >
            </div>
          </div>
        </div>

        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3
            class="text-green-400 text-xs font-bold uppercase tracking-tighter mb-4 flex items-center"
          >
            <CheckCheck class="w-4 h-4 mr-2" /> Top 3 Días con más Completadas
          </h3>
          <div class="space-y-3">
            <div
              v-for="([day, count], i) in topCompletedDays"
              :key="day"
              class="flex justify-between items-center p-3 bg-zinc-950 rounded-lg border border-zinc-800"
            >
              <span class="text-sm font-medium">{{ i + 1 }}. {{ day }}</span>
              <span
                class="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded"
                >{{ count }} tareas</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </GPageContainer>
</template>
