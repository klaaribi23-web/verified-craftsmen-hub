export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      artisan_categories: {
        Row: {
          artisan_id: string
          category_id: string
          created_at: string
          id: string
        }
        Insert: {
          artisan_id: string
          category_id: string
          created_at?: string
          id?: string
        }
        Update: {
          artisan_id?: string
          category_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artisan_categories_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artisan_categories_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "public_artisans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artisan_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      artisan_documents: {
        Row: {
          artisan_id: string
          created_at: string
          expiry_date: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          artisan_id: string
          created_at?: string
          expiry_date?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          artisan_id?: string
          created_at?: string
          expiry_date?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artisan_documents_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artisan_documents_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "public_artisans"
            referencedColumns: ["id"]
          },
        ]
      }
      artisan_services: {
        Row: {
          artisan_id: string
          created_at: string
          description: string | null
          duration: string | null
          id: string
          price: number | null
          title: string
        }
        Insert: {
          artisan_id: string
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          price?: number | null
          title: string
        }
        Update: {
          artisan_id?: string
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          price?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "artisan_services_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artisan_services_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "public_artisans"
            referencedColumns: ["id"]
          },
        ]
      }
      artisan_stories: {
        Row: {
          artisan_id: string
          caption: string | null
          created_at: string
          duration: number | null
          expires_at: string
          id: string
          media_type: string
          media_url: string
          views_count: number | null
        }
        Insert: {
          artisan_id: string
          caption?: string | null
          created_at?: string
          duration?: number | null
          expires_at?: string
          id?: string
          media_type: string
          media_url: string
          views_count?: number | null
        }
        Update: {
          artisan_id?: string
          caption?: string | null
          created_at?: string
          duration?: number | null
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artisan_stories_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artisan_stories_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "public_artisans"
            referencedColumns: ["id"]
          },
        ]
      }
      artisans: {
        Row: {
          activation_sent_at: string | null
          activation_token: string | null
          address: string | null
          business_name: string
          category_id: string | null
          city: string
          created_at: string
          department: string | null
          description: string | null
          display_priority: number | null
          email: string | null
          experience_years: number | null
          facebook_url: string | null
          google_id: string | null
          google_maps_url: string | null
          google_rating: number | null
          google_review_count: number | null
          hourly_rate: number | null
          id: string
          instagram_url: string | null
          insurance_number: string | null
          intervention_radius: number | null
          is_verified: boolean | null
          last_mission_reset: string | null
          latitude: number | null
          linkedin_url: string | null
          longitude: number | null
          missions_applied_this_month: number | null
          missions_completed: number | null
          phone: string | null
          photo_url: string | null
          portfolio_images: string[] | null
          portfolio_videos: string[] | null
          postal_code: string | null
          profile_id: string | null
          qualifications: string[] | null
          rating: number | null
          region: string | null
          review_count: number | null
          siret: string | null
          slug: string | null
          status: Database["public"]["Enums"]["artisan_status"]
          stripe_customer_id: string | null
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
          website_url: string | null
          working_hours: Json | null
        }
        Insert: {
          activation_sent_at?: string | null
          activation_token?: string | null
          address?: string | null
          business_name: string
          category_id?: string | null
          city: string
          created_at?: string
          department?: string | null
          description?: string | null
          display_priority?: number | null
          email?: string | null
          experience_years?: number | null
          facebook_url?: string | null
          google_id?: string | null
          google_maps_url?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          hourly_rate?: number | null
          id?: string
          instagram_url?: string | null
          insurance_number?: string | null
          intervention_radius?: number | null
          is_verified?: boolean | null
          last_mission_reset?: string | null
          latitude?: number | null
          linkedin_url?: string | null
          longitude?: number | null
          missions_applied_this_month?: number | null
          missions_completed?: number | null
          phone?: string | null
          photo_url?: string | null
          portfolio_images?: string[] | null
          portfolio_videos?: string[] | null
          postal_code?: string | null
          profile_id?: string | null
          qualifications?: string[] | null
          rating?: number | null
          region?: string | null
          review_count?: number | null
          siret?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["artisan_status"]
          stripe_customer_id?: string | null
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
          working_hours?: Json | null
        }
        Update: {
          activation_sent_at?: string | null
          activation_token?: string | null
          address?: string | null
          business_name?: string
          category_id?: string | null
          city?: string
          created_at?: string
          department?: string | null
          description?: string | null
          display_priority?: number | null
          email?: string | null
          experience_years?: number | null
          facebook_url?: string | null
          google_id?: string | null
          google_maps_url?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          hourly_rate?: number | null
          id?: string
          instagram_url?: string | null
          insurance_number?: string | null
          intervention_radius?: number | null
          is_verified?: boolean | null
          last_mission_reset?: string | null
          latitude?: number | null
          linkedin_url?: string | null
          longitude?: number | null
          missions_applied_this_month?: number | null
          missions_completed?: number | null
          phone?: string | null
          photo_url?: string | null
          portfolio_images?: string[] | null
          portfolio_videos?: string[] | null
          postal_code?: string | null
          profile_id?: string | null
          qualifications?: string[] | null
          rating?: number | null
          region?: string | null
          review_count?: number | null
          siret?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["artisan_status"]
          stripe_customer_id?: string | null
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "artisans_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artisans_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          display_order: number | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      client_favorites: {
        Row: {
          artisan_id: string
          client_id: string
          created_at: string
          id: string
        }
        Insert: {
          artisan_id: string
          client_id: string
          created_at?: string
          id?: string
        }
        Update: {
          artisan_id?: string
          client_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_favorites_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_favorites_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "public_artisans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_favorites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_archives: {
        Row: {
          archived_at: string
          id: string
          participant_id: string
          user_profile_id: string
        }
        Insert: {
          archived_at?: string
          id?: string
          participant_id: string
          user_profile_id: string
        }
        Update: {
          archived_at?: string
          id?: string
          participant_id?: string
          user_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_archives_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_archives_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_missions: {
        Row: {
          applicants_count: number | null
          budget: number | null
          category_id: string | null
          city: string
          client_city: string
          client_name: string
          created_at: string
          description: string | null
          id: string
          status: string
          title: string
        }
        Insert: {
          applicants_count?: number | null
          budget?: number | null
          category_id?: string | null
          city: string
          client_city: string
          client_name: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title: string
        }
        Update: {
          applicants_count?: number | null
          budget?: number | null
          category_id?: string | null
          city?: string
          client_city?: string
          client_name?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_missions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_profiles: {
        Row: {
          city: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_applications: {
        Row: {
          artisan_id: string
          created_at: string
          id: string
          mission_id: string
          motivation_message: string | null
          status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          artisan_id: string
          created_at?: string
          id?: string
          mission_id: string
          motivation_message?: string | null
          status?: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          artisan_id?: string
          created_at?: string
          id?: string
          mission_id?: string
          motivation_message?: string | null
          status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "mission_applications_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_applications_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "public_artisans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_applications_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          address: string | null
          assigned_artisan_id: string | null
          budget: number | null
          category_id: string | null
          city: string
          client_id: string
          created_at: string
          description: string | null
          id: string
          photos: string[] | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["mission_status"]
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_artisan_id?: string | null
          budget?: number | null
          category_id?: string | null
          city: string
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          photos?: string[] | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["mission_status"]
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_artisan_id?: string | null
          budget?: number | null
          category_id?: string | null
          city?: string
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          photos?: string[] | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["mission_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_assigned_artisan_id_fkey"
            columns: ["assigned_artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_assigned_artisan_id_fkey"
            columns: ["assigned_artisan_id"]
            isOneToOne: false
            referencedRelation: "public_artisans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          artisan_id: string
          client_id: string
          conversation_id: string
          created_at: string
          description: string
          id: string
          message_id: string | null
          price_ht: number
          price_ttc: number | null
          status: string
          tva_rate: number
          updated_at: string
        }
        Insert: {
          artisan_id: string
          client_id: string
          conversation_id: string
          created_at?: string
          description: string
          id?: string
          message_id?: string | null
          price_ht: number
          price_ttc?: number | null
          status?: string
          tva_rate?: number
          updated_at?: string
        }
        Update: {
          artisan_id?: string
          client_id?: string
          conversation_id?: string
          created_at?: string
          description?: string
          id?: string
          message_id?: string | null
          price_ht?: number
          price_ttc?: number | null
          status?: string
          tva_rate?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "public_artisans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          artisan_id: string
          client_id: string
          comment: string | null
          created_at: string
          id: string
          job_type: string | null
          mission_id: string | null
          rating: number
        }
        Insert: {
          artisan_id: string
          client_id: string
          comment?: string | null
          created_at?: string
          id?: string
          job_type?: string | null
          mission_id?: string | null
          rating: number
        }
        Update: {
          artisan_id?: string
          client_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          job_type?: string | null
          mission_id?: string | null
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "public_artisans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string | null
          viewer_ip: string | null
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id?: string | null
          viewer_ip?: string | null
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string | null
          viewer_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "artisan_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          browser: string | null
          created_at: string | null
          device_fingerprint: string
          device_name: string | null
          id: string
          ip_address: string | null
          is_trusted: boolean | null
          last_login_at: string | null
          os: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          device_fingerprint: string
          device_name?: string | null
          id?: string
          ip_address?: string | null
          is_trusted?: boolean | null
          last_login_at?: string | null
          os?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          device_fingerprint?: string
          device_name?: string | null
          id?: string
          ip_address?: string | null
          is_trusted?: boolean | null
          last_login_at?: string | null
          os?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_artisans: {
        Row: {
          address: string | null
          business_name: string | null
          category_id: string | null
          city: string | null
          created_at: string | null
          department: string | null
          description: string | null
          display_priority: number | null
          email: string | null
          experience_years: number | null
          facebook_url: string | null
          google_id: string | null
          google_maps_url: string | null
          google_rating: number | null
          google_review_count: number | null
          hourly_rate: number | null
          id: string | null
          instagram_url: string | null
          intervention_radius: number | null
          is_verified: boolean | null
          latitude: number | null
          linkedin_url: string | null
          longitude: number | null
          missions_completed: number | null
          phone: string | null
          photo_url: string | null
          portfolio_images: string[] | null
          portfolio_videos: string[] | null
          postal_code: string | null
          qualifications: string[] | null
          rating: number | null
          region: string | null
          review_count: number | null
          slug: string | null
          status: Database["public"]["Enums"]["artisan_status"] | null
          subscription_tier: string | null
          updated_at: string | null
          website_url: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          category_id?: string | null
          city?: string | null
          created_at?: string | null
          department?: string | null
          description?: string | null
          display_priority?: number | null
          email?: string | null
          experience_years?: number | null
          facebook_url?: string | null
          google_id?: string | null
          google_maps_url?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          hourly_rate?: number | null
          id?: string | null
          instagram_url?: string | null
          intervention_radius?: number | null
          is_verified?: boolean | null
          latitude?: number | null
          linkedin_url?: string | null
          longitude?: number | null
          missions_completed?: number | null
          phone?: string | null
          photo_url?: string | null
          portfolio_images?: string[] | null
          portfolio_videos?: string[] | null
          postal_code?: string | null
          qualifications?: string[] | null
          rating?: number | null
          region?: string | null
          review_count?: number | null
          slug?: string | null
          status?: Database["public"]["Enums"]["artisan_status"] | null
          subscription_tier?: string | null
          updated_at?: string | null
          website_url?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          category_id?: string | null
          city?: string | null
          created_at?: string | null
          department?: string | null
          description?: string | null
          display_priority?: number | null
          email?: string | null
          experience_years?: number | null
          facebook_url?: string | null
          google_id?: string | null
          google_maps_url?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          hourly_rate?: number | null
          id?: string | null
          instagram_url?: string | null
          intervention_radius?: number | null
          is_verified?: boolean | null
          latitude?: number | null
          linkedin_url?: string | null
          longitude?: number | null
          missions_completed?: number | null
          phone?: string | null
          photo_url?: string | null
          portfolio_images?: string[] | null
          portfolio_videos?: string[] | null
          postal_code?: string | null
          qualifications?: string[] | null
          rating?: number | null
          region?: string | null
          review_count?: number | null
          slug?: string | null
          status?: Database["public"]["Enums"]["artisan_status"] | null
          subscription_tier?: string | null
          updated_at?: string | null
          website_url?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "artisans_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_notification: {
        Args: {
          p_message: string
          p_related_id?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      get_conversation_participants: {
        Args: { p_profile_id: string }
        Returns: {
          avatar_url: string
          email: string
          first_name: string
          id: string
          last_name: string
        }[]
      }
      get_my_profile_id: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_story_views: {
        Args: { story_id_param: string }
        Returns: undefined
      }
      record_story_view: {
        Args: { p_story_id: string; p_viewer_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "artisan" | "client"
      application_status: "pending" | "accepted" | "declined"
      artisan_status: "active" | "suspended" | "pending" | "prospect"
      mission_status:
        | "pending"
        | "assigned"
        | "completed"
        | "cancelled"
        | "pending_approval"
        | "rejected"
        | "published"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "artisan", "client"],
      application_status: ["pending", "accepted", "declined"],
      artisan_status: ["active", "suspended", "pending", "prospect"],
      mission_status: [
        "pending",
        "assigned",
        "completed",
        "cancelled",
        "pending_approval",
        "rejected",
        "published",
      ],
    },
  },
} as const
