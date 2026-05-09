import { motion } from "framer-motion";
import { MousePointerClick, GitCompareArrows, CreditCard } from "lucide-react";

const STEPS = [
  {
    icon: MousePointerClick,
    step: "01",
    title: "Seç",
    description: "İhtiyacınız olan hizmeti seçin. Ev temizliği, koltuk yıkama veya halı temizliği — hesaplayıcımız anında fiyat oluşturur.",
    color: "from-teal-400 to-primary",
  },
  {
    icon: GitCompareArrows,
    step: "02",
    title: "Karşılaştır",
    description: "Bölgenizdeki onaylı firmaları yan yana karşılaştırın. Puanlar, yorumlar ve fiyatlar şeffaf şekilde listelenir.",
    color: "from-sky-400 to-blue-600",
  },
  {
    icon: CreditCard,
    step: "03",
    title: "3 Taksit Avantajı",
    description: "Yakında tüm hizmetlerde faizsiz 3 taksit imkânı. Pilot dönemde ödeme hizmet sonunda firmaya yapılır — taksit altyapımız çok yakında sizinle.",
    color: "from-violet-500 to-purple-600",
  },
];

export function HowItWorks() {
  return (
    <section id="nasil-calisir" className="py-24 bg-secondary/40 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-4"
          >
            Nasıl Çalışır?
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4"
          >
            3 Adımda Temiz Bir Ev
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-muted-foreground text-lg max-w-xl mx-auto"
          >
            Dakikalar içinde rezervasyon oluşturun, güvenle ödeyin.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-16 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-0.5 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30 z-0" />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative z-10 flex flex-col items-center text-center"
              >
                {/* Icon circle */}
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl mb-6 relative`}>
                  <Icon className="w-9 h-9 text-white" strokeWidth={1.75} />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border-2 border-border flex items-center justify-center text-xs font-bold text-foreground shadow-sm">
                    {step.step}
                  </span>
                </div>

                <h3 className="text-2xl font-display font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-xs">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
