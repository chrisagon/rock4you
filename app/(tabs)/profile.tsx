import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Settings, Heart, BookOpen, Trophy, Mail, Lock, LogOut, CreditCard as Edit, X } from 'lucide-react-native';

interface UserProfile {
  name: string;
  email: string;
  level: string;
  joinDate: string;
  favoritesCount: number;
  playlistsCount: number;
  studyTime: string;
}

export default function ProfileScreen() {
  const [user, setUser] = useState<UserProfile>({
    name: 'Marie Dubois',
    email: 'marie.dubois@email.com',
    level: 'Intermédiaire',
    joinDate: 'Mars 2024',
    favoritesCount: 12,
    playlistsCount: 4,
    studyTime: '2h 30min'
  });

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = () => {
    if (loginEmail && loginPassword) {
      setIsLoggedIn(true);
      setShowLogin(false);
      setLoginEmail('');
      setLoginPassword('');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', onPress: () => setIsLoggedIn(false) }
      ]
    );
  };

  const handleSaveProfile = () => {
    setUser({
      ...user,
      name: editName,
      email: editEmail
    });
    setShowEditProfile(false);
  };

  const stats = [
    { icon: Heart, label: 'Favoris', value: user.favoritesCount.toString(), color: '#FF6B35' },
    { icon: BookOpen, label: 'Listes', value: user.playlistsCount.toString(), color: '#4CAF50' },
    { icon: Trophy, label: 'Temps d\'étude', value: user.studyTime, color: '#2196F3' },
  ];

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginContainer}>
          <View style={styles.loginHeader}>
            <Text style={styles.loginTitle}>Rock4you.mobile</Text>
            <Text style={styles.loginSubtitle}>
              {isRegistering ? 'Créer un compte' : 'Connectez-vous à votre compte'}
            </Text>
          </View>

          <View style={styles.loginForm}>
            <TextInput
              style={styles.loginInput}
              placeholder="Email"
              placeholderTextColor="#666"
              value={loginEmail}
              onChangeText={setLoginEmail}
              keyboardType="email-address"
            />
            <TextInput
              style={styles.loginInput}
              placeholder="Mot de passe"
              placeholderTextColor="#666"
              value={loginPassword}
              onChangeText={setLoginPassword}
              secureTextEntry
            />
            {isRegistering && (
              <TextInput
                style={styles.loginInput}
                placeholder="Nom complet"
                placeholderTextColor="#666"
              />
            )}

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>
                {isRegistering ? 'Créer le compte' : 'Se connecter'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
              <Text style={styles.switchText}>
                {isRegistering 
                  ? 'Déjà un compte ? Se connecter' 
                  : 'Pas de compte ? S\'inscrire'}
              </Text>
            </TouchableOpacity>

            {!isRegistering && (
              <TouchableOpacity>
                <Text style={styles.forgotPassword}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mon Profil</Text>
        <TouchableOpacity onPress={() => setShowEditProfile(true)}>
          <Edit size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={40} color="#FF6B35" />
            </View>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.userLevel}>
            <Text style={styles.userLevelText}>Niveau {user.level}</Text>
          </View>
          <Text style={styles.joinDate}>Membre depuis {user.joinDate}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
                <stat.icon size={24} color="#FFF" />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu Options */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Settings size={20} color="#FF6B35" />
            </View>
            <Text style={styles.menuText}>Paramètres</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Mail size={20} color="#FF6B35" />
            </View>
            <Text style={styles.menuText}>Support</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Lock size={20} color="#FF6B35" />
            </View>
            <Text style={styles.menuText}>Confidentialité</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuIcon}>
              <LogOut size={20} color="#F44336" />
            </View>
            <Text style={[styles.menuText, { color: '#F44336' }]}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier le profil</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.editInput}
              placeholder="Nom complet"
              placeholderTextColor="#666"
              value={editName}
              onChangeText={setEditName}
            />

            <TextInput
              style={styles.editInput}
              placeholder="Email"
              placeholderTextColor="#666"
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>Sauvegarder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#CCC',
    marginBottom: 10,
  },
  userLevel: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 10,
  },
  userLevelText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: 'bold',
  },
  joinDate: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  menuContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 10,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#CCC',
    textAlign: 'center',
  },
  loginForm: {
    width: '100%',
  },
  loginInput: {
    backgroundColor: '#1A1A1A',
    color: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  loginButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchText: {
    color: '#FF6B35',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 10,
  },
  forgotPassword: {
    color: '#CCC',
    textAlign: 'center',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  editInput: {
    backgroundColor: '#333',
    color: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});