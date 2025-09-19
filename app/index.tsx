import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking } from 'react-native';
import { router } from 'expo-router';

export default function LandingPage() {
  const handlePrimaryCta = () => router.push('/register');
  const handleLogin = () => router.push('/app/login');
  const handleContact = () => Linking.openURL('https://www.rock4you.dance/');

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent} stickyHeaderIndices={[0]}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('@/assets/images/logoRock4you.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brand}>Rock4you</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleLogin} style={styles.headerLinkBtn}>
            <Text style={styles.headerLinkText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePrimaryCta} style={styles.headerCta}>
            <Text style={styles.headerCtaText}>Inscrivez vous gratuitement</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Révisez toutes vos passes de rock, partout.</Text>
        <Text style={styles.heroSubtitle}>
          Rock4you vous permet de réviser chacune des passes vues en cours de débutant à intermédiaire, sur mobile, tablette ou PC.
        </Text>
        <View style={styles.heroCtas}>
          <TouchableOpacity onPress={handlePrimaryCta} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Inscrivez vous gratuitement</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogin} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
        <Image
          source={{ uri: 'https://pub-e9db5024dff64a89897b25c9ea2a0d59.r2.dev/111%20Enroul%C3%A9s%20infinis%20V3.gif' }}
          style={styles.heroMedia}
        />
      </View>

      {/* Bénéfices */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pourquoi utiliser Rock4you ?</Text>
        <View style={styles.cards}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Des vidéos courtes, ciblées</Text>
            <Text style={styles.cardText}>Chaque passe est isolée pour retravailler facilement entre les cours.</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Prêt pour la soirée</Text>
            <Text style={styles.cardText}>Révisez avant de sortir pour mieux pratiquer sur la piste.</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tout au même endroit</Text>
            <Text style={styles.cardText}>Toutes vos passes à portée de main, avec listes personnalisées.</Text>
          </View>
        </View>
      </View>

      {/* Fonctionnalités */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fonctionnalités</Text>
        <View style={styles.features}>
          <FeatureItem title="Catalogue complet de passes" desc="Toutes les passes de rock enseignées par Rock4you, indexées et chapitrées." />
          <FeatureItem title="Listes personnalisées" desc="Créez vos listes favorites pour réviser rapidement ce qui compte." />
          <FeatureItem title="Révisions express" desc="Des vidéos courtes pour se remettre en tête l'essentiel avant les cours ou les soirées." />
        </View>
      </View>

      {/* FAQ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FAQ</Text>
        <View style={styles.faqItem}>
          <Text style={styles.faqQ}>Comment se connecter ?</Text>
          <Text style={styles.faqA}>Inscrivez-vous puis connectez-vous via la page de login.</Text>
        </View>
        <View style={styles.faqItem}>
          <Text style={styles.faqQ}>Que vais-je trouver dans l'application ?</Text>
          <Text style={styles.faqA}>Toutes les passes de rock proposées par Rock4you dans ses cours.</Text>
        </View>
        <View style={styles.faqItem}>
          <Text style={styles.faqQ}>Combien ça coûte ?</Text>
          <Text style={styles.faqA}>L'application est gratuite pour vous donner envie de suivre des cours de rock.</Text>
        </View>
      </View>

      {/* Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Envie d'aller plus loin ?</Text>
        <Text style={styles.bodyText}>
          Découvrez nos cours de Rock 4 Temps à Paris.
        </Text>
        <TouchableOpacity onPress={handleContact} style={styles.linkBtn}>
          <Text style={styles.linkBtnText}>Rock 4 You • Cours de Rock 4 Temps à Paris</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© {new Date().getFullYear()} Rock4you</Text>
      </View>
    </ScrollView>
  );
}

function FeatureItem({ title, desc }: { title: string; desc: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: '#000', flex: 1 },
  pageContent: { paddingBottom: 40 },

  header: {
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f1f',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 32, height: 32, marginRight: 10 },
  brand: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerLinkBtn: { paddingVertical: 8, paddingHorizontal: 12, marginRight: 8 },
  headerLinkText: { color: '#fff', fontWeight: '600' },
  headerCta: { backgroundColor: '#FF6B35', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  headerCtaText: { color: '#fff', fontWeight: '700' },

  hero: { paddingHorizontal: 20, paddingTop: 28, alignItems: 'center' },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  heroSubtitle: { color: '#cfcfcf', fontSize: 16, textAlign: 'center', maxWidth: 720 },
  heroCtas: { flexDirection: 'row', gap: 12 as unknown as number, marginTop: 18 },
  primaryBtn: { backgroundColor: '#FF6B35', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, marginRight: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
  secondaryBtn: { borderColor: '#FF6B35', borderWidth: 1, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10 },
  secondaryBtnText: { color: '#FF6B35', fontWeight: '800' },
  heroMedia: { width: '90%', height: 260, borderRadius: 12, marginTop: 24 },

  section: { paddingHorizontal: 20, paddingTop: 28 },
  sectionTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 14, textAlign: 'center' },
  cards: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  card: { backgroundColor: '#101010', borderRadius: 12, padding: 16, margin: 8, width: 320 },
  cardTitle: { color: '#fff', fontWeight: '700', marginBottom: 6, fontSize: 16 },
  cardText: { color: '#cfcfcf' },

  features: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  featureItem: { backgroundColor: '#101010', borderRadius: 12, padding: 16, margin: 8, width: 320 },
  featureTitle: { color: '#fff', fontWeight: '700', marginBottom: 6, fontSize: 16 },
  featureDesc: { color: '#cfcfcf' },

  faqItem: { backgroundColor: '#101010', borderRadius: 12, padding: 16, marginBottom: 10 },
  faqQ: { color: '#fff', fontWeight: '700', marginBottom: 6 },
  faqA: { color: '#cfcfcf' },

  bodyText: { color: '#cfcfcf', textAlign: 'center', marginBottom: 12 },
  linkBtn: { alignSelf: 'center', borderColor: '#FF6B35', borderWidth: 1, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  linkBtnText: { color: '#FF6B35', fontWeight: '800' },

  footer: { paddingHorizontal: 20, paddingVertical: 24, alignItems: 'center' },
  footerText: { color: '#666' },
});

