<?php

namespace App\Providers\Filament;

use App\Filament\Widgets\ProjectStatsOverview;
use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages\Dashboard;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Widgets\AccountWidget;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('admin')
            ->path('admin')
            ->brandLogo(asset('images/logo.png'))
            ->brandLogoHeight('2.75rem')
            ->brandName('Enrich Project Vault')
            ->colors([
                'primary' => Color::Indigo,
                'gray' => Color::Slate,
            ])
            ->sidebarCollapsibleOnDesktop()
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\Filament\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\Filament\Pages')
            ->pages([
                Dashboard::class,
            ])
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\Filament\Widgets')
            ->widgets([
                ProjectStatsOverview::class,
                AccountWidget::class,
            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                \App\Http\Middleware\FilamentAuthenticate::class,
            ])
            ->authGuard('web')
            ->maxContentWidth(\Filament\Support\Enums\Width::Full)
            ->renderHook(
                \Filament\View\PanelsRenderHook::HEAD_END,
                fn () => \Illuminate\Support\Facades\Blade::render('
                    <style>
                        /* Reduced left and right padding for main container */
                        .fi-main {
                            max-width: 100% !important;
                            padding-left: 0.875rem !important;
                            padding-right: 0.875rem !important;
                        }
                        @media (min-width: 640px) {
                            .fi-main {
                                padding-left: 1.25rem !important;
                                padding-right: 1.25rem !important;
                            }
                        }
                        @media (min-width: 1024px) {
                            .fi-main {
                                padding-left: 1.5rem !important;
                                padding-right: 1.5rem !important;
                            }
                        }

                        /* Ensure sections stretch 100% full width */
                        .fi-section,
                        .fi-sc-section {
                            width: 100% !important;
                        }

                        /* Vertical Relation Manager Tabs (Matching Portal Vault UI & Fully Responsive) */
                        .fi-sc-tabs.fi-vertical {
                            display: flex;
                            flex-direction: column;
                            gap: 1.25rem;
                            width: 100%;
                        }
                        .fi-sc-tabs.fi-vertical > .fi-tabs.fi-vertical {
                            width: 100%;
                            padding: 0.5rem;
                            background: rgba(15, 23, 42, 0.7);
                            border: 1px solid rgba(51, 65, 85, 0.7);
                            border-radius: 0.875rem;
                            display: flex;
                            flex-direction: column;
                            gap: 0.35rem;
                            box-shadow: 0 4px 14px 0 rgba(0, 0, 0, 0.25);
                        }
                        @media (min-width: 1024px) {
                            .fi-sc-tabs.fi-vertical {
                                flex-direction: row;
                                align-items: flex-start;
                                gap: 1.5rem;
                            }
                            .fi-sc-tabs.fi-vertical > .fi-tabs.fi-vertical {
                                width: 280px;
                                min-width: 250px;
                                max-width: 320px;
                                flex-shrink: 0;
                            }
                        }
                        .fi-sc-tabs.fi-vertical .fi-tabs-item {
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            width: 100%;
                            padding: 0.625rem 0.875rem;
                            border-radius: 0.5rem;
                            font-size: 0.8125rem;
                            font-weight: 600;
                            transition: all 0.15s ease;
                            text-align: left;
                            border: 1px solid transparent;
                            box-sizing: border-box;
                        }
                        .fi-sc-tabs.fi-vertical .fi-tabs-item .fi-tabs-item-label {
                            flex: 1;
                            text-align: left;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        }
                        .fi-sc-tabs.fi-vertical .fi-tabs-item .fi-badge {
                            margin-inline-start: 0.5rem;
                            font-size: 0.6875rem;
                            font-weight: 700;
                            padding: 0.125rem 0.5rem;
                            border-radius: 9999px;
                            flex-shrink: 0;
                            line-height: 1.25;
                        }
                        .fi-sc-tabs.fi-vertical .fi-tabs-item.fi-active {
                            background-color: rgba(99, 102, 241, 0.15) !important;
                            color: #a5b4fc !important;
                            border-color: rgba(99, 102, 241, 0.35) !important;
                        }
                        .fi-sc-tabs.fi-vertical .fi-tabs-item.fi-active .fi-tabs-item-label,
                        .fi-sc-tabs.fi-vertical .fi-tabs-item.fi-active .fi-icon {
                            color: #a5b4fc !important;
                        }
                        .fi-sc-tabs.fi-vertical .fi-tabs-item.fi-active .fi-badge {
                            background-color: rgba(99, 102, 241, 0.25) !important;
                            color: #c7d2fe !important;
                            border: 1px solid rgba(99, 102, 241, 0.35) !important;
                        }
                        .fi-sc-tabs.fi-vertical .fi-tabs-item:not(.fi-active) {
                            color: #94a3b8;
                        }
                        .fi-sc-tabs.fi-vertical .fi-tabs-item:not(.fi-active):hover {
                            color: #f1f5f9;
                            background-color: rgba(51, 65, 85, 0.45);
                        }
                        .fi-sc-tabs.fi-vertical .fi-tabs-item:not(.fi-active) .fi-badge {
                            background-color: rgba(30, 41, 59, 0.85);
                            color: #94a3b8;
                        }
                        .fi-sc-tabs.fi-vertical > div:not(.fi-tabs),
                        .fi-sc-tabs.fi-vertical .fi-sc-tabs-tab {
                            flex: 1;
                            min-width: 0;
                            width: 100%;
                            overflow-x: auto;
                        }
                    </style>
                ')
            );
    }
}
