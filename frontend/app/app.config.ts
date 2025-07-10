export default defineAppConfig({
  ui: {
    primary: "green",
    gray: "slate",
    notifications: {
      position: "bottom-0 right-0",
    },
    notification: {
      default: {
        color: "primary",
      },
      color: {
        red: {
          solid: "bg-red-500 dark:bg-red-400 text-white",
          ghost: "text-red-500 dark:text-red-400 bg-red-500/10",
        },
        green: {
          solid: "bg-green-500 dark:bg-green-400 text-white",
          ghost: "text-green-500 dark:text-green-400 bg-green-500/10",
        },
      },
    },
    button: {
      color: {
        red: {
          solid:
            "shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 focus:ring-2 focus:ring-red-500",
          outline:
            "text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400",
        },
      },
    },
  },
});
