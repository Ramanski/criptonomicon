<template>
  <div
    v-show="tickerTips"
    class="flex bg-white shadow-md p-1 rounded-md flex-wrap"
  >
    <span
      v-for="tickerTip in tickerTips"
      :key="tickerTip"
      @click="OnTickerTipClicked(tickerTip)"
      class="
        inline-flex
        items-center
        px-2
        m-1
        rounded-md
        text-xs
        font-medium
        bg-gray-300
        text-gray-800
        cursor-pointer
      "
    >
      {{ tickerTip }}
    </span>
  </div>
  <div v-show="isRepeatedTickerName" class="text-sm text-red-600">
    Такой тикер уже добавлен!
  </div>
</template>

<script>
export default {
  name: "TickerTips",

  props: {
    filterTip: String,
    isRepeatedTickerName: Boolean,
  },

  emits: ["onTickerTipClicked"],

  data() {
    return {
      coinlist: null,
    };
  },

  created() {
    fetch(`https://min-api.cryptocompare.com/data/all/coinlist?summary=true`)
      .then((result) => result.json())
      .then(({ Data }) => (this.coinlist = Object.keys(Data)));
  },

  computed: {
    tickerTips() {
      var coinList = this.coinlist;

      if (coinList && this.filterTip) {
        var matchedCoinList = coinList.filter((coin) =>
          coin.startsWith(this.filterTip.toUpperCase())
        );

        return matchedCoinList.slice(0, 4);
      }

      return null;
    },
  },

  methods: {
    OnTickerTipClicked(tickerName) {
      this.$emit("onTickerTipClicked", tickerName);
    },
  },
};
</script>
