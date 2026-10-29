// Viết tay theo đúng định dạng `supabase gen types typescript`.
// Khi đã đăng nhập Supabase CLI, chạy `npm run db:types` để sinh lại file này.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          id: string
          owner_id: string
          title: string
          author: string | null
          description: string | null
          cover_path: string | null
          format: Database["public"]["Enums"]["book_format"]
          visibility: Database["public"]["Enums"]["book_visibility"]
          chapter_count: number
          word_count: number
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          owner_id?: string
          title: string
          author?: string | null
          description?: string | null
          cover_path?: string | null
          format: Database["public"]["Enums"]["book_format"]
          visibility?: Database["public"]["Enums"]["book_visibility"]
          chapter_count?: number
          word_count?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          author?: string | null
          description?: string | null
          cover_path?: string | null
          format?: Database["public"]["Enums"]["book_format"]
          visibility?: Database["public"]["Enums"]["book_visibility"]
          chapter_count?: number
          word_count?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "books_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          id: string
          book_id: string
          title: string
          content_html: string
          position: number
          word_count: number
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          title?: string
          content_html: string
          position: number
          word_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          title?: string
          content_html?: string
          position?: number
          word_count?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_progress: {
        Row: {
          user_id: string
          book_id: string
          chapter_id: string
          block_index: number
          percent: number
          updated_at: string
        }
        Insert: {
          user_id?: string
          book_id: string
          chapter_id: string
          block_index?: number
          percent?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          book_id?: string
          chapter_id?: string
          block_index?: number
          percent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_progress_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          book_id: string
          chapter_id: string
          block_index: number
          excerpt: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          book_id: string
          chapter_id: string
          block_index: number
          excerpt: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          chapter_id?: string
          block_index?: number
          excerpt?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      highlights: {
        Row: {
          id: string
          user_id: string
          book_id: string
          chapter_id: string
          start_offset: number
          end_offset: number
          quote: string
          note: string | null
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          book_id: string
          chapter_id: string
          start_offset: number
          end_offset: number
          quote: string
          note?: string | null
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          chapter_id?: string
          start_offset?: number
          end_offset?: number
          quote?: string
          note?: string | null
          color?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlights_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlights_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_chapter: {
        Args: { p_chapter_id: string }
        Returns: undefined
      }
      reorder_chapters: {
        Args: { p_book_id: string; p_chapter_ids: string[] }
        Returns: undefined
      }
      search_books: {
        Args: { p_query?: string; p_scope?: string }
        Returns: Database["public"]["Tables"]["books"]["Row"][]
        SetofOptions: {
          from: "*"
          to: "books"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      book_format: "epub" | "txt" | "md"
      book_visibility: "private" | "public"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T]
